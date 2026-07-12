import { describe, expect, it } from 'vitest';
import {
  AiProviderNotConfiguredError,
  ConversationNotFoundError,
  NotOrganizationMemberError,
  SpaceNotFoundInOrganizationError,
  UnknownChatModelError,
  type ChatSource,
} from '../../src/contexts/ai/modules/chat/domain/chat';
import type { ContextSearchPort } from '../../src/contexts/ai/modules/chat/ports/context-search.port';
import type { LlmCredentialPort } from '../../src/contexts/ai/modules/chat/ports/llm-credential.port';
import type {
  LlmGenerateInput,
  LlmGenerateResult,
  LlmProviderPort,
} from '../../src/contexts/ai/modules/chat/ports/llm-provider.port';
import { SendChatMessageUseCase } from '../../src/contexts/ai/modules/chat/use-cases/send-chat-message/send-chat-message.use-case';
import {
  FakeChatMembership,
  FakeChatRealtimeNotifier,
  FakeChatSpaceAccess,
  FakeConversationRepository,
} from './fakes/fake-chat-module';

class FakeLlmCredentials implements LlmCredentialPort {
  keys = new Map<string, string>(); // `${orgId}:${provider}`
  async getApiKey(organizationId: string, provider: string): Promise<string | null> {
    return this.keys.get(`${organizationId}:${provider}`) ?? null;
  }
}

class FakeLlm implements LlmProviderPort {
  lastInput: LlmGenerateInput | null = null;
  reply = 'Respuesta del modelo';

  async generate(input: LlmGenerateInput): Promise<LlmGenerateResult> {
    this.lastInput = input;
    return { content: this.reply, tokensInput: 10, tokensOutput: 20 };
  }
}

class FakeContextSearch implements ContextSearchPort {
  results: ChatSource[] = [];
  shouldFail = false;

  async search(): Promise<ChatSource[]> {
    if (this.shouldFail) throw new Error('retrieval provider down');
    return this.results;
  }
}

function setup() {
  const membership = new FakeChatMembership();
  const spaceAccess = new FakeChatSpaceAccess();
  const conversations = new FakeConversationRepository();
  const credentials = new FakeLlmCredentials();
  const llm = new FakeLlm();
  const contextSearch = new FakeContextSearch();
  const notifier = new FakeChatRealtimeNotifier();

  membership.members.add('user-1:org-1');
  spaceAccess.spaces.set('space-1', 'org-1');
  credentials.keys.set('org-1:gemini', 'una-api-key');

  const useCase = new SendChatMessageUseCase(
    membership,
    spaceAccess,
    conversations,
    credentials,
    llm,
    contextSearch,
    notifier,
  );

  return {
    membership,
    spaceAccess,
    conversations,
    credentials,
    llm,
    contextSearch,
    notifier,
    useCase,
  };
}

const BASE_INPUT = {
  userId: 'user-1',
  organizationId: 'org-1',
  spaceId: 'space-1',
  conversationId: null,
  content: '¿Cómo funciona el alta de usuarios?',
  mode: 'explain-process',
  model: 'gemini-flash-latest',
};

describe('SendChatMessageUseCase', () => {
  it('answers with the chosen model and persists both question and answer', async () => {
    const { useCase, llm, conversations } = setup();

    const result = await useCase.execute(BASE_INPUT);

    expect(result.message.role).toBe('assistant');
    expect(result.message.content).toBe('Respuesta del modelo');
    expect(llm.lastInput?.model).toBe('gemini-flash-latest');
    expect(llm.lastInput?.apiKey).toBe('una-api-key');
    // user + assistant persisted, with model and tokens on the assistant one.
    expect(conversations.messages.map((m) => m.role)).toEqual(['user', 'assistant']);
    expect(conversations.messages[1].modelName).toBe('gemini-flash-latest');
    expect(conversations.messages[1].tokensInput).toBe(10);
    expect(conversations.messages[1].tokensOutput).toBe(20);
  });

  it('starts a new conversation when none is given and titles it after the first message', async () => {
    const { useCase, conversations, notifier } = setup();

    const result = await useCase.execute(BASE_INPUT);

    expect(result.conversationId).toBe('conv-1');
    expect(conversations.conversations).toHaveLength(1);
    expect(conversations.conversations[0].title).toBe('¿Cómo funciona el alta de usuarios?');
    // The owner is notified so their other tabs refetch the thread.
    expect(notifier.events).toEqual([
      {
        userId: 'user-1',
        organizationId: 'org-1',
        spaceId: 'space-1',
        conversationId: 'conv-1',
      },
    ]);
  });

  it('reuses the given conversation and keeps its existing title', async () => {
    const { useCase, conversations } = setup();
    const existing = await conversations.create('space-1', 'user-1');
    await conversations.setTitle(existing.id, 'Título original');

    const result = await useCase.execute({ ...BASE_INPUT, conversationId: existing.id });

    expect(result.conversationId).toBe(existing.id);
    expect(conversations.conversations).toHaveLength(1);
    expect(conversations.conversations[0].title).toBe('Título original');
    expect(conversations.messages.every((m) => m.conversationId === existing.id)).toBe(true);
  });

  it("rejects another user's conversation and one from another space", async () => {
    const { useCase, conversations, spaceAccess, membership } = setup();
    const foreign = await conversations.create('space-1', 'user-2');

    await expect(
      useCase.execute({ ...BASE_INPUT, conversationId: foreign.id }),
    ).rejects.toBeInstanceOf(ConversationNotFoundError);

    membership.members.add('user-1:org-1');
    spaceAccess.spaces.set('space-2', 'org-1');
    const otherSpace = await conversations.create('space-2', 'user-1');
    await expect(
      useCase.execute({ ...BASE_INPUT, conversationId: otherSpace.id }),
    ).rejects.toBeInstanceOf(ConversationNotFoundError);
  });

  it('builds the system prompt from the chosen mode template', async () => {
    const { useCase, llm } = setup();

    await useCase.execute({ ...BASE_INPUT, mode: 'acceptance-criteria' });

    expect(llm.lastInput?.systemPrompt).toContain('criterios de aceptación');
    expect(llm.lastInput?.systemPrompt).toContain('Given/When/Then');
    expect(llm.lastInput?.systemPrompt).toContain('ContextHub AI');
  });

  it('injects retrieved fragments as context and returns them as sources', async () => {
    const { useCase, llm, contextSearch } = setup();
    contextSearch.results = [
      {
        documentName: 'Manual.pdf',
        fragment: 'El alta de usuarios requiere aprobación del supervisor.',
        relevance: 0.91,
      },
    ];

    const result = await useCase.execute(BASE_INPUT);

    expect(llm.lastInput?.systemPrompt).toContain('Manual.pdf');
    expect(llm.lastInput?.systemPrompt).toContain('aprobación del supervisor');
    expect(result.sources).toHaveLength(1);
    expect(result.sources[0]).toMatchObject({ documentName: 'Manual.pdf', relevance: 0.91 });
  });

  it('dedupes sources by document even when several fragments share one', async () => {
    const { useCase, llm, contextSearch } = setup();
    contextSearch.results = [
      { documentName: 'Manual.pdf', fragment: 'Fragmento A', relevance: 0.9 },
      { documentName: 'Manual.pdf', fragment: 'Fragmento B', relevance: 0.8 },
      { documentName: 'Anexo.pdf', fragment: 'Fragmento C', relevance: 0.7 },
      { documentName: 'Manual.pdf', fragment: 'Fragmento D', relevance: 0.6 },
    ];

    const result = await useCase.execute(BASE_INPUT);

    // All 4 fragments reach the prompt; sources contain one entry per
    // document with its most relevant fragment.
    expect(llm.lastInput?.systemPrompt).toContain('Fragmento B');
    expect(llm.lastInput?.systemPrompt).toContain('Fragmento D');
    expect(result.sources).toHaveLength(2);
    expect(result.sources[0]).toMatchObject({ documentName: 'Manual.pdf', relevance: 0.9 });
    expect(result.sources[1]).toMatchObject({ documentName: 'Anexo.pdf', relevance: 0.7 });
  });

  it('still works without context when retrieval fails', async () => {
    const { useCase, contextSearch } = setup();
    contextSearch.shouldFail = true;

    const result = await useCase.execute(BASE_INPUT);

    expect(result.message.content).toBe('Respuesta del modelo');
    expect(result.sources).toEqual([]);
  });

  it('fails with AiProviderNotConfiguredError when the org has no key and no fallback', async () => {
    const { useCase, credentials, conversations } = setup();
    credentials.keys.clear();

    await expect(useCase.execute(BASE_INPUT)).rejects.toBeInstanceOf(AiProviderNotConfiguredError);
    expect(conversations.messages).toHaveLength(0);
  });

  it('rejects a non-member and a space from another organization', async () => {
    const { useCase, spaceAccess } = setup();

    await expect(useCase.execute({ ...BASE_INPUT, userId: 'intruso' })).rejects.toBeInstanceOf(
      NotOrganizationMemberError,
    );

    spaceAccess.spaces.set('space-1', 'org-OTRA');
    await expect(useCase.execute(BASE_INPUT)).rejects.toBeInstanceOf(
      SpaceNotFoundInOrganizationError,
    );
  });

  it('rejects a model outside the catalog and defaults when no model is given', async () => {
    const { useCase, llm } = setup();

    await expect(
      useCase.execute({ ...BASE_INPUT, model: 'modelo-inexistente' }),
    ).rejects.toBeInstanceOf(UnknownChatModelError);

    await useCase.execute({ ...BASE_INPUT, model: null });
    expect(llm.lastInput?.model).toBe('gemini-flash-latest');
    expect(llm.lastInput?.provider).toBe('gemini');
  });

  it('resolves the provider from the model across the whole catalog', async () => {
    const { useCase, llm, credentials } = setup();
    credentials.keys.set('org-1:anthropic', 'clave-anthropic');

    await useCase.execute({ ...BASE_INPUT, model: 'claude-sonnet-5' });

    expect(llm.lastInput?.provider).toBe('anthropic');
    expect(llm.lastInput?.model).toBe('claude-sonnet-5');
    expect(llm.lastInput?.apiKey).toBe('clave-anthropic');
  });

  it('lets keyless providers (ollama) chat without any credential', async () => {
    const { useCase, llm, credentials } = setup();
    credentials.keys.clear();

    const result = await useCase.execute({ ...BASE_INPUT, model: 'llama3.1:8b' });

    expect(result.message.content).toBe('Respuesta del modelo');
    expect(llm.lastInput?.provider).toBe('ollama');
    expect(llm.lastInput?.apiKey).toBe('');
  });

  it('falls back to general mode when an unknown mode arrives', async () => {
    const { useCase, llm } = setup();

    await useCase.execute({ ...BASE_INPUT, mode: 'modo-inexistente' });

    expect(llm.lastInput?.systemPrompt).toContain('consulta general');
  });
});
