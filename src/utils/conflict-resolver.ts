import { LLM } from './llm.ts';
import { z } from 'zod';

const MERGE_DEVICE_IDENTIFIER_PROMPT = `
You are a helpful assistant merging device identifiers.

Please merge the following values into a single value:
["MacBook Pro (13-inch, Mid 2013)", "MacBook Pro (13-inch, Early 2014)"] -> "MacBook Pro (13-inch, Mid 2013 / Early 2014)"
["iMac (20-inch, Early 2009)", "iMac (24-inch, Early 2009)"] -> "iMac (20-inch / 24-inch, Early 2009)"
["Mac Pro (2019)","Mac Pro (Rack, 2019)"] -> "Mac Pro (2019)"
["MacBook Pro (15-inch, 2.53GHz, Mid 2009)", "MacBook Pro (15-inch, Mid 2009)"] -> "MacBook Pro (15-inch, Mid 2009)"
["Mac Pro (Mid 2010)", "Mac Pro (Mid 2012)", "Mac Pro Server (Mid 2010)", "Mac Pro Server (Mid 2012)"] -> "Mac Pro (Mid 2010 / Mid 2012)"

It should be in the same language as the values:
["MacBook Air 11(2013년 중반 모델)", "MacBook Air 11(2014년 초반 모델)"] -> "MacBook Air 11(2013년 중반 모델 / 2014년 초반 모델)"
["iMac 20(2009년 초반 모델)", "iMac 24(2009년 초반 모델)"] -> "iMac 20/24(2009년 초반 모델)"

It should be ordered by the year:
["MacBook Pro (Retina, 13-inch, Early 2013)", "MacBook Pro (Retina, 13-inch, Late 2012)"] -> "MacBook Pro (Retina, 13-inch, Late 2012 / Early 2013)"

Please do not include any other text in your response including \`\`\`
`;

const MERGE_DEVICE_IDENTIFIER_SCHEMA = z.object({
  merged: z.string().describe(
    'The merged device identifier. e.g. "MacBook Pro (13-inch, Mid 2013 / Early 2014)"',
  ),
});

const DEFAULT_MODEL = 'gpt-4o-mini';
const OPENAI_MODEL = Deno.env.get('OPENAI_MODEL') || DEFAULT_MODEL;

export class ConflictResolver {
  private readonly llm: LLM;

  constructor() {
    this.llm = new LLM();
  }

  get isAvailable() {
    return this.llm.isAvailable;
  }

  async resolve(values: string[]): Promise<string> {
    const { merged } = await this.llm.transform({
      systemPrompt: MERGE_DEVICE_IDENTIFIER_PROMPT,
      jsonSchema: MERGE_DEVICE_IDENTIFIER_SCHEMA,
      model: OPENAI_MODEL,
      input: values.join('\n'),
    }) ?? {};

    if (!merged) {
      console.error('Failed to merge device identifiers.', values);
      return values.join(' / ');
    }

    return merged;
  }
}
