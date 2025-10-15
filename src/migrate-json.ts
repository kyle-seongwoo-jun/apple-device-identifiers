const SOURCE_FILE = 'mac-device-identifiers.json';
const DEST_FILE = 'mac-device-identifiers-unique.json';
const CONFLICT_MESSAGE = 'YOU NEED TO MIGRATE THIS DEVICE MANUALLY';

// read json files
const sourceJson = readJsonFile<string | string[]>(SOURCE_FILE);
const destinationJson = readJsonFile<string>(DEST_FILE);

// migrate source to dest
let conflicts = 0;
const migratedJson = migrateJson(sourceJson, destinationJson, {
  // warn about conflicts
  onConflict: (key, value) => {
    console.warn(`"${key}":`, value);
    conflicts++;
  },
});

// sort by keys
const sortedJson = sortJson(migratedJson);

// write to file
writeJsonFile(DEST_FILE, sortedJson);

// exit (1 if there are conflicts, 0 otherwise)
console.log(conflicts > 0 ? `done with ${conflicts} conflicts.` : 'done.');
Deno.exit(conflicts > 0 ? 1 : 0);

function readJsonFile<TValue>(path: string): { [key: string]: TValue } {
  const jsonString = Deno.readTextFileSync(path);
  return JSON.parse(jsonString) as { [key: string]: TValue };
}

function writeJsonFile(path: string, json: { [key: string]: string }) {
  const jsonString = JSON.stringify(json, null, 2);
  Deno.writeTextFileSync(path, jsonString);
}

function migrateJson(
  source: { [key: string]: string | string[] },
  destination: { [key: string]: string },
  { onConflict }: { onConflict?: (key: string, value: string[]) => void } = {},
) {
  const migrated = { ...destination };
  const deletedKeys = new Set(Object.keys(destination));
  const conflicts: [string, string[]][] = [];

  Object.entries(source).forEach(([key, value]) => {
    if (typeof value === 'string') {
      // add or update
      migrated[key] = value;
    } else if (key in destination) {
      // already migrated
      // do nothing
    } else {
      migrated[key] = CONFLICT_MESSAGE;
      conflicts.push([key, value]);
    }
    deletedKeys.delete(key);
  });

  // remove deleted items
  deletedKeys.forEach((key) => delete migrated[key]);

  // handle conflicts
  conflicts.forEach(([key, value]) => onConflict?.(key, value));

  return migrated;
}

function sortJson(json: { [key: string]: string }) {
  const collator = new Intl.Collator(undefined, {
    numeric: true,
    sensitivity: 'base',
  });
  const sortedKeys = [...Object.keys(json)].sort((a, b) =>
    collator.compare(a, b)
  );
  const sortedJson = {} as { [key: string]: string };
  sortedKeys.forEach((key) => sortedJson[key] = json[key]);
  return sortedJson;
}
