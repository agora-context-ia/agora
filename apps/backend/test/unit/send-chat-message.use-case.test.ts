import { describe, expect, it } from 'vitest';
import {
  AiProviderNotConfiguredError,
  NotOrganizationMemberError,
  SpaceNotFoundInOrganizationError,
  UnknownChatModelError,
  type ChatMessage,
  type ChatRole,
  type ChatSource,
} from '../../src/contexts/ai/modules/chat/domain/chat';
import type { ContextSearchPort } from '../../src/contexts/ai/modules/chat/ports/context-search.port';
import type {
  AppendMessageData,
  ConversationRepositoryPort,
} from '../../src/contexts/ai/modules/chat/ports/conversation-repository.port';
import type { LlmCredentialPort } from '../../src/contexts/ai/modules/chat/ports/llm-credential.port';
import type {
  LlmGenerateInput,
  LlmGenerateResult,
  LlmProviderPort,
} from '../../src/contexts/ai/modules/chat/ports/llm-provider.port';
import { SendChatMessageUseCase } from '../../src/contexts/ai/modules/chat/use-cases/send-chat-message/send-chat-message.use-case';

class FakeMembership {
  members = new Set<string>();
  async isMember(userId: string, organizationId: string): Promise<boolean> {
    return this.members.has(`${userId}:${organizationId}`);
  }
}

class FakeSpaceAccess {
  spaces = new Map<string, string>(); // spaceId -> organizationId
  async findSpaceOrganization(spaceId: string): Promise<string | null> {
    return this.spaces.get(spaceId) ?? null;
  }
}

class FakeConversationRepository implements ConversationRepositoryPort {
  messages: Array<AppendMessageData & { id: string; createdAt: Date }> = [];
  private counter = 0;

  async findOrCreate(): Promise<{ id: string }> {
    return { id: 'conv-1' };
  }

  async findBySpaceAndUser(): Promise<{ id: string } | null> {
    return { id: 'conv-1' };
  }

  async appendMessage(data: AppendMessageData): Promise<ChatMessage> {
    this.counter += 1;
    const stored = { ...data, id: `msg-${this.counter}`, createdAt: new Date() };
    this.messages.push(stored);
    return {
      id: stored.id,
      role: stored.role as ChatRole,
      content: stored.content,
      createdAt: stored.createdAt,
    };
  }

  async listMessages(): Promise<ChatMessage[]> {
    return this.messages.map((message) => ({
      id: message.id,
      role: message.role as ChatRole,
      content: message.content,
      createdAt: message.createdAt,
    }));
  }
}

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
  const membership = new FakeMembership();
  const spaceAccess = new FakeSpaceAccess();
  const conversations = new FakeConversationRepository();
  const credentials = new FakeLlmCredentials();
  const llm = new FakeLlm();
  const contextSearch = new FakeContextSearch();

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
  );

  return { membership, spaceAccess, conversations, credentials, llm, contextSearch, useCase };
}

const BASE_INPUT = {
  userId: 'user-1',
  organizationId: 'org-1',
  spaceId: 'space-1',
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
      useCase.execute({ ...BASE_INPUT, model: 'gpt-4o' }),
    ).rejects.toBeInstanceOf(UnknownChatModelError);

    await useCase.execute({ ...BASE_INPUT, model: null });
    expect(llm.lastInput?.model).toBe('gemini-flash-latest');
  });

  it('falls back to general mode when an unknown mode arrives', async () => {
    const { useCase, llm } = setup();

    await useCase.execute({ ...BASE_INPUT, mode: 'modo-inexistente' });

    expect(llm.lastInput?.systemPrompt).toContain('consulta general');
  });
});
