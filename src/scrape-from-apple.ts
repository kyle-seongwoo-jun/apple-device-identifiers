import { AppleWebsiteScraper } from './scrapers/apple-website-scraper.ts';
import { DeviceDictionary } from './scrapers/scraper.interface.ts';
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
  let conflicts = 0;
  const mergedDict = mergeMacDeviceIdentifiers(dict, old, {
    onConflict: (key, value) => {
      console.warn(`"${key}":`, value);
      conflicts++;
    },
  });
  await writeToFile(uniqueFile, mergedDict);

  return conflicts;
}
const conflicts = await Promise.all(
  LOCALES.map((locale) => generateJsonFile(locale)),
).then((results) => results.reduce((acc, conflict) => acc + conflict, 0));

// copy en-US to root
Deno.copyFileSync(`data/en-US/${ORIGINAL_FILE}`, ORIGINAL_FILE);
Deno.copyFileSync(`data/en-US/${UNIQUE_FILE}`, UNIQUE_FILE);

console.log(
  conflicts > 0 ? `Done! but with ${conflicts} conflicts.` : 'Done!',
);
Deno.exit(conflicts ? 1 : 0);
