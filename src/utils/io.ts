export async function readFromFile<T>(file: string) {
  const json = await Deno.readTextFile(file).catch(() => '{}');
  return JSON.parse(json) as T;
}

export async function writeToFile(file: string, dict: unknown) {
  const json = JSON.stringify(dict, null, 2);
  await Deno.writeTextFile(file, json);
}
