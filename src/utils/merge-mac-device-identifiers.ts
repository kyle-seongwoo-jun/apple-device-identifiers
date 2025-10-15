import {
  DeviceDictionary,
  DeviceDictionaryWithDuplicates,
} from '../scrapers/scraper.interface.ts';

const CONFLICT_MESSAGE = 'YOU NEED TO MIGRATE THIS DEVICE MANUALLY';

interface MergeMacDeviceIdentifiersOptions {
  onConflict?: (key: string, value: string[]) => void;
}

export function mergeMacDeviceIdentifiers(
  source: DeviceDictionaryWithDuplicates,
  destination: DeviceDictionary,
  options: MergeMacDeviceIdentifiersOptions = {},
) {
  // migrate source to dest
  const migratedJson = migrateJson(source, destination, options);

  // sort by keys
  const sortedJson = sortJson(migratedJson);
  return sortedJson;
}

function migrateJson(
  source: DeviceDictionaryWithDuplicates,
  destination: DeviceDictionary,
  { onConflict }: MergeMacDeviceIdentifiersOptions = {},
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

function sortJson(json: DeviceDictionary) {
  const collator = new Intl.Collator(undefined, {
    numeric: true,
    sensitivity: 'base',
  });
  const sortedKeys = [...Object.keys(json)].sort((a, b) =>
    collator.compare(a, b)
  );
  const sortedJson = {} as DeviceDictionary;
  sortedKeys.forEach((key) => sortedJson[key] = json[key]);
  return sortedJson;
}
