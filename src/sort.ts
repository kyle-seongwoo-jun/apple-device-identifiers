const COLLATOR = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: 'base',
});
const SIMULATORS = ['i386', 'x86_64', 'arm64'];

interface SortDictionaryOptions {
  ios?: boolean;
}

function compareBySimulators(a: string, b: string) {
  // Sort simulators to the top
  if (SIMULATORS.includes(a) && SIMULATORS.includes(b)) {
    return SIMULATORS.indexOf(a) - SIMULATORS.indexOf(b);
  } else if (SIMULATORS.includes(a)) {
    return -1;
  } else if (SIMULATORS.includes(b)) {
    return 1;
  }
  return 0;
}

function iosCompare(a: string, b: string) {
  // Sort iOS devices to the top
  if (a.startsWith('iPhone') && b.startsWith('iPhone')) {
    return 0;
  } else if (a.startsWith('iPhone')) {
    return -1;
  } else if (b.startsWith('iPhone')) {
    return 1;
  }
  return 0;
}

function naturalCompare(a: string, b: string) {
  return COLLATOR.compare(a, b);
}

function compare(a: string, b: string, ios = false) {
  return compareBySimulators(a, b) || (ios ? iosCompare(a, b) : 0) ||
    naturalCompare(a, b);
}

export function sortDictionary(
  dict: { [key: string]: string },
  { ios }: SortDictionaryOptions = {},
) {
  const sortedKeys = [...Object.keys(dict)].sort((a, b) => compare(a, b, ios));
  const sortedDict = {} as { [key: string]: string };
  sortedKeys.forEach((key) => (sortedDict[key] = dict[key]));
  return sortedDict;
}
