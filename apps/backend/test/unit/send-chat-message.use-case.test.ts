import { describe, expect, it } from 'vitest';
import {
  AiProviderNotConfiguredError,
  NotOrganizationMemberError,
  SpaceNotFoundInOrganizationError,
  UnknownChatModelError,
  type ChatMessage,
  type ChatRole,
} from '../../src/contexts/ai/modules/chat/domain/chat';
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
import type { EmbeddingProviderPort } from '../../src/contexts/knowledge-management/modules/documents/ports/embedding-provider.port';
import type {
  EmbeddingRepositoryPort,
  SemanticSearchHit,
} from '../../src/contexts/knowledge-management/modules/documents/ports/embedding-repository.port';

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

class FakeEmbeddingProvider implements EmbeddingProviderPort {
  readonly modelName = 'fake-embed';
  readonly dimensions = 3;
  shouldFail = false;

  async embedBatch(texts: string[]): Promise<number[][]> {
    if (this.shouldFail) throw new Error('proveedor de embeddings caído');
    return texts.map(() => [0.1, 0.2, 0.3]);
  }
}

class FakeEmbeddingRepository implements EmbeddingRepositoryPort {
  hits: SemanticSearchHit[] = [];
  async replaceForSource(): Promise<void> {}
  async deleteForSource(): Promise<void> {}
  async search(): Promise<SemanticSearchHit[]> {
    return this.hits;
  }
}

function setup() {
  const membership = new FakeMembership();
  const spaceAccess = new FakeSpaceAccess();
  const conversations = new FakeConversationRepository();
  const credentials = new FakeLlmCredentials();
  const llm = new FakeLlm();
  const embeddingProvider = new FakeEmbeddingProvider();
  const embeddings = new FakeEmbeddingRepository();

  membership.members.add('user-1:org-1');
  spaceAccess.spaces.set('space-1', 'org-1');
  credentials.keys.set('org-1:gemini', 'una-api-key');

  const useCase = new SendChatMessageUseCase(
    membership,
    spaceAccess,
    conversations,
    credentials,
    llm,
    embeddingProvider,
    embeddings,
  );

  return { membership, spaceAccess, conversations, credentials, llm, embeddingProvider, embeddings, useCase };
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
  it('responde usando el modelo elegido y persiste pregunta y respuesta', async () => {
    const { useCase, llm, conversations } = setup();

    const result = await useCase.execute(BASE_INPUT);

    expect(result.message.role).toBe('assistant');
    expect(result.message.content).toBe('Respuesta del modelo');
    expect(llm.lastInput?.model).toBe('gemini-flash-latest');
    expect(llm.lastInput?.apiKey).toBe('una-api-key');
    // user + assistant persistidos, con modelo y tokens en el del asistente.
    expect(conversations.messages.map((m) => m.role)).toEqual(['user', 'assistant']);
    expect(conversations.messages[1].modelName).toBe('gemini-flash-latest');
    expect(conversations.messages[1].tokensInput).toBe(10);
    expect(conversations.messages[1].tokensOutput).toBe(20);
  });

  it('arma el system prompt con la plantilla del modo elegido', async () => {
    const { useCase, llm } = setup();

    await useCase.execute({ ...BASE_INPUT, mode: 'acceptance-criteria' });

    expect(llm.lastInput?.systemPrompt).toContain('criterios de aceptación');
    expect(llm.lastInput?.systemPrompt).toContain('Given/When/Then');
    expect(llm.lastInput?.systemPrompt).toContain('ContextHub AI');
  });

  it('inyecta los fragmentos recuperados como contexto y los devuelve como fuentes', async () => {
    const { useCase, llm, embeddings } = setup();
    embeddings.hits = [
      {
        documentId: 'doc-1',
        fileName: 'Manual.pdf',
        chunkIndex: 0,
        content: 'El alta de usuarios requiere aprobación del supervisor.',
        score: 0.91,
      },
    ];

    const result = await useCase.execute(BASE_INPUT);

    expect(llm.lastInput?.systemPrompt).toContain('Manual.pdf');
    expect(llm.lastInput?.systemPrompt).toContain('aprobación del supervisor');
    expect(result.sources).toHaveLength(1);
    expect(result.sources[0]).toMatchObject({ documentName: 'Manual.pdf', relevance: 0.91 });
  });

  it('sigue funcionando sin contexto si el proveedor de embeddings falla', async () => {
    const { useCase, embeddingProvider } = setup();
    embeddingProvider.shouldFail = true;

    const result = await useCase.execute(BASE_INPUT);

    expect(result.message.content).toBe('Respuesta del modelo');
    expect(result.sources).toEqual([]);
  });

  it('falla con AiProviderNotConfiguredError si la org no tiene key ni hay fallback', async () => {
    const { useCase, credentials, conversations } = setup();
    credentials.keys.clear();

    await expect(useCase.execute(BASE_INPUT)).rejects.toBeInstanceOf(AiProviderNotConfiguredError);
    expect(conversations.messages).toHaveLength(0);
  });

  it('rechaza a un no-miembro y a un espacio de otra organización', async () => {
    const { useCase, spaceAccess } = setup();

    await expect(useCase.execute({ ...BASE_INPUT, userId: 'intruso' })).rejects.toBeInstanceOf(
      NotOrganizationMemberError,
    );

    spaceAccess.spaces.set('space-1', 'org-OTRA');
    await expect(useCase.execute(BASE_INPUT)).rejects.toBeInstanceOf(
      SpaceNotFoundInOrganizationError,
    );
  });

  it('rechaza un modelo fuera del catálogo y usa el default si no viene modelo', async () => {
    const { useCase, llm } = setup();

    await expect(
      useCase.execute({ ...BASE_INPUT, model: 'gpt-4o' }),
    ).rejects.toBeInstanceOf(UnknownChatModelError);

    await useCase.execute({ ...BASE_INPUT, model: null });
    expect(llm.lastInput?.model).toBe('gemini-flash-latest');
  });

  it('cae al modo general si llega un modo desconocido', async () => {
    const { useCase, llm } = setup();

    await useCase.execute({ ...BASE_INPUT, mode: 'modo-inexistente' });

    expect(llm.lastInput?.systemPrompt).toContain('consulta general');
  });
});
