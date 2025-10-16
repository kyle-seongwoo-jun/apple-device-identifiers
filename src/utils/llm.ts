import { OpenAI } from '@openai/openai';
import { zodTextFormat } from '@openai/openai/helpers/zod';
import { ZodType } from 'zod';

export class LLM {
  private readonly openai?: OpenAI;

  constructor() {
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    this.openai = apiKey ? new OpenAI({ apiKey }) : undefined;
  }

  get isAvailable() {
    return this.openai !== undefined;
  }

  async transform<T>(params: {
    systemPrompt: string;
    input: string;
    jsonSchema: ZodType<T>;
    model: string;
    metadata?: { [key: string]: string };
  }) {
    if (!this.openai) {
      throw new Error(
        'OPENAI_API_KEY is not set. Please set it in the environment variables.',
      );
    }

    const { systemPrompt, input, jsonSchema, model, metadata } = params;

    const response = await this.openai.responses.parse({
      model,
      input: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: input },
      ],
      text: {
        format: zodTextFormat(jsonSchema, 'item'),
      },
      metadata,
    });

    return response.output_parsed;
  }
}
