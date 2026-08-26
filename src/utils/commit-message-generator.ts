import { NoObjectGeneratedError } from 'ai';
import { z } from 'zod';
import { LLM } from './llm.ts';

const COMMIT_MESSAGE_PROMPT = `
You are a helpful assistant generating git commit messages in Conventional Commits format.

Generate a concise commit message from the given \`git diff\`.
It must be a single line, with no body and no trailing period.

feat(locales): add cjk locales
fix(scraper): handle missing device name column
chore(data): update apple device identifiers
`;

const COMMIT_MESSAGE_SCHEMA = z.object({
  message: z.string().describe(
    'The single-line commit message. e.g. "feat(locales): add cjk locales"',
  ),
});

export class CommitMessageGenerator {
  private readonly llm: LLM;

  constructor() {
    this.llm = new LLM();
  }

  get isAvailable() {
    return this.llm.isAvailable;
  }

  async generate(diff: string): Promise<string | undefined> {
    try {
      const { message } = await this.llm.transform({
        systemPrompt: COMMIT_MESSAGE_PROMPT,
        jsonSchema: COMMIT_MESSAGE_SCHEMA,
        input: diff,
      });

      // the caller writes this into $GITHUB_OUTPUT, which is line-based
      return message.split('\n')[0].trim() || undefined;
    } catch (error) {
      if (!NoObjectGeneratedError.isInstance(error)) throw error;

      console.error('Failed to generate a commit message.');
      return undefined;
    }
  }
}
