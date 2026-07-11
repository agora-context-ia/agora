import { AI_PROVIDER_CATALOG } from '../../../../../identity/modules/ai-credentials/domain/ai-provider-credential';
import type { EmbeddingProviderPort } from '../../../../../knowledge-management/modules/documents/ports/embedding-provider.port';
import type { EmbeddingRepositoryPort } from '../../../../../knowledge-management/modules/documents/ports/embedding-repository.port';
import type { SpaceAccessPort } from '../../../../../knowledge-management/modules/documents/ports/space-access.port';
import type { OrganizationMembershipPort } from '../../../../../knowledge-management/modules/projects/ports/organization-membership.port';
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
import type { ConversationRepositoryPort } from '../../ports/conversation-repository.port';
import type { LlmCredentialPort } from '../../ports/llm-credential.port';
import type { LlmProviderPort } from '../../ports/llm-provider.port';

export interface SendChatMessageInput {
  userId: string;
  organizationId: string;
  spaceId: string;
  content: string;
  mode: string;
  model: string | null;
}

export interface SendChatMessageResult {
  message: ChatMessage;
  sources: ChatSource[];
}

// Cantidad de fragmentos de documentación que se inyectan como contexto
// y de mensajes previos que se mandan como historial.
const CONTEXT_CHUNKS = 5;
const HISTORY_MESSAGES = 12;
// Los fragmentos completos van al prompt; a la UI vuelve una vista corta.
const SOURCE_FRAGMENT_PREVIEW = 300;

export class SendChatMessageUseCase {
  constructor(
    private readonly membership: OrganizationMembershipPort,
    private readonly spaceAccess: SpaceAccessPort,
    private readonly conversations: ConversationRepositoryPort,
    private readonly llmCredentials: LlmCredentialPort,
    private readonly llm: LlmProviderPort,
    private readonly embeddingProvider: EmbeddingProviderPort,
    private readonly embeddings: EmbeddingRepositoryPort,
  ) {}

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

    // El mensaje del usuario se persiste recién acá: si el LLM falló, la
    // conversación no queda con preguntas sin respuesta.
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
      sources: context.map((source) => ({
        ...source,
        fragment:
          source.fragment.length > SOURCE_FRAGMENT_PREVIEW
            ? `${source.fragment.slice(0, SOURCE_FRAGMENT_PREVIEW)}…`
            : source.fragment,
      })),
    };
  }

  // Búsqueda semántica en el espacio. Si el proveedor de embeddings no
  // está disponible (ej. Ollama apagado en local) el chat sigue sin
  // contexto en vez de romperse.
  private async retrieveContext(spaceId: string, query: string): Promise<ChatSource[]> {
    try {
      const [queryEmbedding] = await this.embeddingProvider.embedBatch([query]);
      const hits = await this.embeddings.search(
        spaceId,
        queryEmbedding,
        this.embeddingProvider.modelName,
        CONTEXT_CHUNKS,
      );
      return hits.map((hit) => ({
        documentName: hit.fileName,
        fragment: hit.content,
        relevance: hit.score,
      }));
    } catch {
      return [];
    }
  }
}

// El modelo elegido define el proveedor (por ahora solo Gemini). Sin
// modelo explícito se usa el primero del catálogo.
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
