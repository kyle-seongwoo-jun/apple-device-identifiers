import '@std/dotenv/load';

import { AppleWebsiteScraper } from './scrapers/apple-website-scraper.ts';
import type { DeviceDictionary } from './scraper.interface.ts';
import { readFromFile, writeToFile } from './utils/io.ts';
import { mergeMacDeviceIdentifiers } from './utils/merge-mac-device-identifiers.ts';

const scraper = new AppleWebsiteScraper();
const LOCALES = [
  'en-US',
];
const ORIGINAL_FILE = 'mac-device-identifiers.json';
const UNIQUE_FILE = 'mac-device-identifiers-unique.json';

async function generateJsonFile(locale: string) {
  const dir = `data/${locale}`;
  Deno.mkdirSync(dir, { recursive: true });
  const originalFile = `${dir}/${ORIGINAL_FILE}`;
  const uniqueFile = `${dir}/${UNIQUE_FILE}`;

  console.log(`Generating ${originalFile}...`);
  const dict = await scraper.scrape({ locale });
  await writeToFile(originalFile, dict);

  console.log(`Merging with ${uniqueFile}...`);
  const old = await readFromFile<DeviceDictionary>(uniqueFile);
  const mergedDict = await mergeMacDeviceIdentifiers(dict, old, {
    onConflict: (key, values) => {
      // when openai is not set, we need to migrate manually
      console.warn(`[Conflict] "${key}":`, values);
    },
    onConflictResolved: (values, resolved) => {
      console.info(`[Resolved] "${resolved}" from:`);
      console.info(values);
    },
  });
  await writeToFile(uniqueFile, mergedDict);
}
await Promise.all(
  LOCALES.map((locale) => generateJsonFile(locale)),
);

// copy en-US to root
Deno.copyFileSync(`data/en-US/${ORIGINAL_FILE}`, ORIGINAL_FILE);
Deno.copyFileSync(`data/en-US/${UNIQUE_FILE}`, UNIQUE_FILE);

console.log('Done!');
