import { LlmRequestFailedError } from '../domain/chat';
import type {
  LlmGenerateInput,
  LlmGenerateResult,
  LlmProviderPort,
} from '../ports/llm-provider.port';

/**
 * Dispatches each generation call to the adapter of the provider that owns
 * the requested model. This is the single wiring point for LLM providers:
 * adding one means implementing {@link LlmProviderPort} and registering it
 * here (see docs/development/extending-agora.md).
 */
export class ProviderRoutingLlmAdapter implements LlmProviderPort {
  constructor(private readonly providers: Record<string, LlmProviderPort>) {}

  /** @throws LlmRequestFailedError when no adapter is registered for the provider. */
  async generate(input: LlmGenerateInput): Promise<LlmGenerateResult> {
    const provider = this.providers[input.provider];
    if (!provider) {
      throw new LlmRequestFailedError(
        `No hay un adaptador configurado para el proveedor "${input.provider}"`,
      );
    }
    return provider.generate(input);
  }
}
