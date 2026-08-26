import '@std/dotenv/load';

import { CommitMessageGenerator } from './utils/commit-message-generator.ts';

async function getDiff(): Promise<string> {
  const command = new Deno.Command('git', {
    args: ['diff', 'HEAD'],
    stdout: 'piped',
    stderr: 'piped',
  });
  const { code, stdout, stderr } = await command.output();

  if (code !== 0) {
    throw new Error(`git diff failed: ${new TextDecoder().decode(stderr)}`);
  }

  return new TextDecoder().decode(stdout);
}

const diff = await getDiff();
if (!diff.trim()) {
  console.error('No changes detected');
  Deno.exit(0);
}

const generator = new CommitMessageGenerator();
if (!generator.isAvailable) {
  console.error(
    'No API key is set. Please set it in the environment variables.',
  );
  Deno.exit(1);
}

const message = await generator.generate(diff);
if (!message) {
  Deno.exit(1);
}

// stdout carries the message; everything else goes to stderr
console.log(message);
