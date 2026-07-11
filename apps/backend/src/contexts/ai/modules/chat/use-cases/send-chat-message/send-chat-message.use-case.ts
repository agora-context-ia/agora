import { AI_PROVIDER_CATALOG } from '../../../../../../shared/ai-provider-catalog';
import {
  AiProviderNotConfiguredError,
  NotOrganizationMemberError,
  SpaceNotFoundInOrganizationError,
  UnknownChatModelError,
  isChatMode,
  type ChatMessage,
  type ChatSource,
} from '../../domain/chat';
import { buildSystemPrompt } from '../../domain/chat-prompts';
import type { ContextSearchPort } from '../../ports/context-search.port';
import type { ConversationRepositoryPort } from '../../ports/conversation-repository.port';
import type { LlmCredentialPort } from '../../ports/llm-credential.port';
import type { LlmProviderPort } from '../../ports/llm-provider.port';
import type { OrganizationMembershipPort } from '../../ports/organization-membership.port';
import type { SpaceAccessPort } from '../../ports/space-access.port';

/** A user question: target space, task mode and (optional) model. */
export interface SendChatMessageInput {
  userId: string;
  organizationId: string;
  spaceId: string;
  content: string;
  mode: string;
  model: string | null;
}

/** The assistant reply plus the deduplicated sources shown in the UI. */
export interface SendChatMessageResult {
  message: ChatMessage;
  sources: ChatSource[];
}

/** Documentation fragments injected as context and prior messages sent as history. */
const CONTEXT_CHUNKS = 5;
const HISTORY_MESSAGES = 12;
/** Full fragments go into the prompt; the UI receives a short preview. */
const SOURCE_FRAGMENT_PREVIEW = 300;

/**
 * Answers a user question over a space's documentation using the
 * organization's configured LLM.
 *
 * Flow: validate membership and space ownership → resolve model and API
 * key → retrieve semantic context → call the LLM with the mode-specific
 * system prompt and recent history → persist both messages.
 */
export class SendChatMessageUseCase {
  constructor(
    private readonly membership: OrganizationMembershipPort,
    private readonly spaceAccess: SpaceAccessPort,
    private readonly conversations: ConversationRepositoryPort,
    private readonly llmCredentials: LlmCredentialPort,
    private readonly llm: LlmProviderPort,
    private readonly contextSearch: ContextSearchPort,
  ) {}

  /**
   * @throws NotOrganizationMemberError when the user is not a member.
   * @throws SpaceNotFoundInOrganizationError when the space belongs to another org.
   * @throws UnknownChatModelError when the requested model is not in the catalog.
   * @throws AiProviderNotConfiguredError when no API key is available.
   * @throws LlmRequestFailedError when the provider call fails (from the LLM adapter).
   */
  async execute(input: SendChatMessageInput): Promise<SendChatMessageResult> {
    const isMember = await this.membership.isMember(input.userId, input.organizationId);
    if (!isMember) throw new NotOrganizationMemberError();

    const spaceOrganization = await this.spaceAccess.findSpaceOrganization(input.spaceId);
    if (spaceOrganization !== input.organizationId) throw new SpaceNotFoundInOrganizationError();

    const { provider, model } = resolveModel(input.model);
    const mode = isChatMode(input.mode) ? input.mode : 'general';

    const apiKey = await this.llmCredentials.getApiKey(input.organizationId, provider);
    if (!apiKey) throw new AiProviderNotConfiguredError();

    const context = await this.retrieveContext(input.spaceId, input.content);

    const conversation = await this.conversations.findOrCreate(input.spaceId, input.userId);
    const history = await this.conversations.listMessages(conversation.id, HISTORY_MESSAGES);

    const reply = await this.llm.generate({
      apiKey,
      model,
      systemPrompt: buildSystemPrompt(mode, context),
      history: history.map((message) => ({ role: message.role, content: message.content })),
      userMessage: input.content,
    });

    // The user message is persisted only now: if the LLM call failed, the
    // conversation is not left with unanswered questions.
    await this.conversations.appendMessage({
      conversationId: conversation.id,
      role: 'user',
      content: input.content,
    });
    const assistantMessage = await this.conversations.appendMessage({
      conversationId: conversation.id,
      role: 'assistant',
      content: reply.content,
      modelName: model,
      tokensInput: reply.tokensInput,
      tokensOutput: reply.tokensOutput,
    });

    return {
      message: assistantMessage,
      sources: dedupeByDocument(context).map((source) => ({
        ...source,
        fragment:
          source.fragment.length > SOURCE_FRAGMENT_PREVIEW
            ? `${source.fragment.slice(0, SOURCE_FRAGMENT_PREVIEW)}…`
            : source.fragment,
      })),
    };
  }

  /**
   * Semantic search over the space. If retrieval is unavailable (e.g.
   * Ollama down in local dev) the chat continues without context instead
   * of failing.
   */
  private async retrieveContext(spaceId: string, query: string): Promise<ChatSource[]> {
    try {
      return await this.contextSearch.search(spaceId, query, CONTEXT_CHUNKS);
    } catch {
      return [];
    }
  }
}

/**
 * The prompt receives every retrieved fragment, but the UI shows one
 * source per document: the most relevant fragment (hits arrive ordered by
 * descending score).
 */
function dedupeByDocument(sources: ChatSource[]): ChatSource[] {
  const seen = new Set<string>();
  return sources.filter((source) => {
    if (seen.has(source.documentName)) return false;
    seen.add(source.documentName);
    return true;
  });
}

/**
 * The chosen model determines the provider (only Gemini for now). Without
 * an explicit model the first catalog entry is used.
 *
 * @throws UnknownChatModelError when the model is not in the catalog.
 */
function resolveModel(requested: string | null): { provider: string; model: string } {
  if (requested === null || requested === '') {
    return { provider: 'gemini', model: AI_PROVIDER_CATALOG.gemini.models[0].value };
  }

  for (const [provider, catalog] of Object.entries(AI_PROVIDER_CATALOG)) {
    if (catalog.models.some((model) => model.value === requested)) {
      return { provider, model: requested };
    }
  }
  throw new UnknownChatModelError(requested);
}
