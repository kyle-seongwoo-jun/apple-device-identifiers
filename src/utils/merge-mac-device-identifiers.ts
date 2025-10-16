import type {
  DeviceDictionary,
  DeviceDictionaryWithDuplicates,
} from '../scraper.interface.ts';
import { ConflictResolver } from './conflict-resolver.ts';
interface MergeMacDeviceIdentifiersOptions {
  onConflict?: (key: string, values: string[]) => void;
  onConflictResolved?: (values: string[], resolved: string) => void;
}

const CONFLICT_MESSAGE = 'YOU NEED TO MIGRATE THIS DEVICE MANUALLY';
const conflictResolver = new ConflictResolver();

export async function mergeMacDeviceIdentifiers(
  source: DeviceDictionaryWithDuplicates,
  destination: DeviceDictionary,
  options: MergeMacDeviceIdentifiersOptions = {},
) {
  // migrate source to dest
  const migratedJson = await migrateJson(source, destination, options);

  // sort by keys
  const sortedJson = sortJson(migratedJson);
  return sortedJson;
}

async function migrateJson(
  source: DeviceDictionaryWithDuplicates,
  destination: DeviceDictionary,
  { onConflict, onConflictResolved }: MergeMacDeviceIdentifiersOptions = {},
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
      // conflict
      if (!conflictResolver.isAvailable) {
        migrated[key] = CONFLICT_MESSAGE;
        onConflict?.(key, value);
      } else {
        conflicts.push([key, value]);
      }
    }
    deletedKeys.delete(key);
  });

  // remove deleted items
  deletedKeys.forEach((key) => delete migrated[key]);

  // handle conflicts
  await Promise.all(conflicts.map(async ([key, values]) => {
    const resolved = await conflictResolver.resolve(values);
    migrated[key] = resolved;
    onConflictResolved?.(values, resolved);
  }));

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
