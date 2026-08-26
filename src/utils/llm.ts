import { createOpenAI } from '@ai-sdk/openai';
import { generateText, type LanguageModel, Output } from 'ai';
import { ZodType } from 'zod';

const DEFAULT_PROVIDER = 'openai';
const DEFAULT_MODEL = 'gpt-5.6-luna';

interface Provider {
  /** Environment variable holding the API key for this provider. */
  apiKeyEnv: string;
  /** Creates a model factory bound to the given API key. */
  createModel: (apiKey: string, modelId: string) => LanguageModel;
}

/**
 * To support another provider, add its `@ai-sdk/*` package to `deno.json`
 * and register it here. Nothing else in the codebase needs to change.
 */
const PROVIDERS: Record<string, Provider> = {
  openai: {
    apiKeyEnv: 'OPENAI_API_KEY',
    createModel: (apiKey, modelId) => createOpenAI({ apiKey })(modelId),
  },
};

export class LLM {
  readonly providerId: string;
  readonly modelId: string;
  private readonly apiKeyEnv: string;
  private readonly model?: LanguageModel;

  constructor() {
    this.providerId = Deno.env.get('LLM_PROVIDER') || DEFAULT_PROVIDER;
    this.modelId = Deno.env.get('LLM_MODEL') || DEFAULT_MODEL;

    const provider = PROVIDERS[this.providerId];
    if (!provider) {
      throw new Error(
        `Unknown LLM_PROVIDER "${this.providerId}". Supported providers: ${
          Object.keys(PROVIDERS).join(', ')
        }.`,
      );
    }

    this.apiKeyEnv = provider.apiKeyEnv;
    const apiKey = Deno.env.get(provider.apiKeyEnv);
    this.model = apiKey
      ? provider.createModel(apiKey, this.modelId)
      : undefined;
  }

  get isAvailable() {
    return this.model !== undefined;
  }

  async transform<T>(params: {
    systemPrompt: string;
    input: string;
    jsonSchema: ZodType<T>;
  }): Promise<T> {
    if (!this.model) {
      throw new Error(
        `${this.apiKeyEnv} is not set. Please set it in the environment variables.`,
      );
    }

    const { systemPrompt, input, jsonSchema } = params;

    const { output } = await generateText({
      model: this.model,
      instructions: systemPrompt,
      prompt: input,
      output: Output.object({ schema: jsonSchema }),
    });

    return output;
  }
}
