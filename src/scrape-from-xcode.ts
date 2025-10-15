import type { DeviceDictionary } from './scrapers/scraper.interface.ts';
import { XcodeScraper } from './scrapers/xcode-scraper.ts';
import { readFromFile } from './utils/io.ts';
import { sortDictionary } from './utils/sort.ts';

const scraper = new XcodeScraper();
const platforms = [
  { name: 'iPhoneOS', file: 'ios-device-identifiers.json' },
  { name: 'WatchOS', file: 'watchos-device-identifiers.json' },
  { name: 'AppleTVOS', file: 'tvos-device-identifiers.json' },
  { name: 'XROS', file: 'visionos-device-identifiers.json' },
];

async function generateJsonFile(platform: { name: string; file: string }) {
  console.log(`Generating ${platform.file}...`);
  const dict = await scraper.scrape(platform.name, {
    onRename: (key, newKey, value) => {
      console.info(`Renamed: "${key}" to "${newKey}": "${value}"`);
    },
    onSkip: (key, value) => {
      console.info(`Skipped: "${key}": "${value}"`);
    },
  });

  console.log(`Merging with previous ${platform.file}...`);
  const old = await readFromFile<DeviceDictionary>(platform.file);
  const merged = { ...dict, ...old };
  const sorted = sortDictionary(merged, {
    ios: platform.name === 'iPhoneOS',
  });

  console.log(`Writing ${platform.file}...`);
  const json = JSON.stringify(sorted, null, 2);
  await Deno.writeTextFile(platform.file, json);
}
await Promise.all(platforms.map((p) => generateJsonFile(p)));

console.log('Done!');
