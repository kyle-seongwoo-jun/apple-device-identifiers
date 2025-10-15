import type { DeviceDictionary } from './scraper.interface.ts';

interface XcodeScraperOptions {
  onRename?: (key: string, newKey: string, value: string) => void;
  onSkip?: (key: string, value: string) => void;
}

export class XcodeScraper {
  async scrape(platform: string, options: XcodeScraperOptions = {}) {
    const dict = await this.scrapeFromXcode(platform);
    return this.cleanUp(dict, options);
  }

  private async scrapeFromXcode(platform: string) {
    const command = new Deno.Command('bash', {
      args: ['-c', `scripts/scrape-from-xcode.sh ${platform}`],
      stdout: 'piped',
    });
    const output = await command.output().then((o) =>
      new TextDecoder().decode(o.stdout)
    );
    const obj = JSON.parse(output) as DeviceDictionary;
    return obj;
  }

  private cleanUp(
    dict: DeviceDictionary,
    { onRename, onSkip }: XcodeScraperOptions = {},
  ) {
    const newDict = {} as DeviceDictionary;
    Object.keys(dict).forEach((key) => {
      // remove suffix: iPad14,3-A to iPad14,3
      const newKey = key.includes('-') ? key.split('-')[0] : key;
      if (key !== newKey) {
        onRename?.(key, newKey, dict[key]);
      }

      // skip *Family*: MacFamily, RealityFamily
      if (newKey.includes('Family')) {
        onSkip?.(key, dict[key]);
        return;
      }

      newDict[newKey] = dict[key];
    });
    return newDict;
  }
}
