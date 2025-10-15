import { AppleWebsiteScraper } from './scrapers/apple-website-scraper.ts';
import { DeviceDictionary } from './scrapers/scraper.interface.ts';
import { readFromFile, writeToFile } from './utils/io.ts';
import { mergeMacDeviceIdentifiers } from './utils/merge-mac-device-identifiers.ts';

const ORIGINAL_FILE = 'mac-device-identifiers.json';
const UNIQUE_FILE = 'mac-device-identifiers-unique.json';

console.log('generating...');

// scrape
const scraper = new AppleWebsiteScraper();
const dict = await scraper.scrape();
await writeToFile(ORIGINAL_FILE, dict);

// merge
let conflicts = 0;
const old = await readFromFile<DeviceDictionary>(UNIQUE_FILE);
const mergedDict = mergeMacDeviceIdentifiers(dict, old, {
  // warn about conflicts
  onConflict: (key, value) => {
    console.warn(`"${key}":`, value);
    conflicts++;
  },
});
await writeToFile(UNIQUE_FILE, mergedDict);

// exit (1 if there are conflicts, 0 otherwise)
console.log(
  conflicts > 0 ? `generated with ${conflicts} conflicts.` : 'generated.',
);
Deno.exit(conflicts > 0 ? 1 : 0);
