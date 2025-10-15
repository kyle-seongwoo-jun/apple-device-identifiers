import { DOMParser, Element, HTMLDocument } from '@b-fuze/deno-dom';
import type { DeviceDictionaryWithDuplicates } from './scraper.interface.ts';

interface Device {
  id: string;
  name: string;
}

const MAC_WEBSITES = {
  'MacBook': 'https://support.apple.com/en-us/103257',
  'MacBook Air': 'https://support.apple.com/en-us/102869',
  'MacBook Pro': 'https://support.apple.com/en-us/108052',
  'iMac': 'https://support.apple.com/en-us/108054',
  'Mac mini': 'https://support.apple.com/en-us/102852',
  'Mac Studio': 'https://support.apple.com/en-us/102231',
  'Mac Pro': 'https://support.apple.com/en-us/102887',
};

export class AppleWebsiteScraper {
  private static MODEL_IDENTIFIER = 'Model Identifier: ';

  private collator = new Intl.Collator(undefined, {
    numeric: true,
    sensitivity: 'base',
  });
  private domParser = new DOMParser();

  async scrape() {
    const devices = await this.loadDevicesFromUrls(Object.values(MAC_WEBSITES));
    return this.toDict(devices);
  }

  private async loadDevicesFromUrls(urls: string[]): Promise<Device[]> {
    return ([] as Device[]).concat(
      ...await Promise.all(
        urls.map((url) => this.loadDevicesFromUrl(url)),
      ),
    );
  }

  private async loadDevicesFromUrl(url: string): Promise<Device[]> {
    // request HTML from URL
    const document = await this._loadDocumentFromUrl(url).catch((e) => {
      console.error('[ERROR] HTML document loading failed. url:', url);
      throw e;
    });

    const pageTitle = document.querySelector('.gb-header')?.innerText;
    console.log(`[INFO] parsing ${url} (${pageTitle})`);

    try {
      const devices = this._parseDevicesFromDocument(document);
      console.log(`[INFO] parsed ${devices.length} devices from ${url}`);
      return devices;
    } catch (e) {
      console.error('[ERROR] device parsing failed. url:', url);
      throw e;
    }
  }

  private async _loadDocumentFromUrl(url: string): Promise<HTMLDocument> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `HTTP request failed. status: ${response.status} ${response.statusText}, url: ${url}`,
      );
    }

    const html = await response.text();
    const document = this.domParser.parseFromString(html, 'text/html');
    if (!document) {
      throw new Error(`HTML parsing failed. url: ${url}`);
    }

    return document;
  }

  private _parseDevicesFromDocument(document: HTMLDocument): Device[] {
    const names = this._parseNamesFrom(document);
    const ids = this._parseIdsFrom(document);
    if (names.length !== ids.length) {
      throw new Error(
        `names and ids are not matched. names: ${names.length}, ids: ${ids.length}`,
      );
    }

    const devices = names.map((name, i) => {
      const id = ids[i];
      return id.split(/; |, /).map((id) => ({ id, name }));
    }).flat();

    return devices;
  }

  private _parseNamesFrom(document: HTMLDocument): string[] {
    const names = this._parseTextsFrom(document, 'p.gb-paragraph b');

    // if there's a colon at the end of these field, it's 2024 renewed website
    // so we need to parse names in new way
    const is2024Renewed = names.some((name) => name.endsWith(':'));
    if (is2024Renewed) {
      const names = this._parseTextsFrom(document, 'h2.gb-header')
        .filter((text) => text.includes('Mac')); // "Learn More" added on MacPro website
      return names;
    } else {
      // 2024 currently, only "MacBook" has old website
      console.log('[DEBUG] old website detected');
    }

    return names;
  }

  private _parseIdsFrom(document: HTMLDocument): string[] {
    const { MODEL_IDENTIFIER } = AppleWebsiteScraper;
    const ids = this._parseTextsFrom(document, 'p.gb-paragraph')
      .filter((text) => text.startsWith(MODEL_IDENTIFIER))
      .map((text) => text.replace(MODEL_IDENTIFIER, ''));

    return ids;
  }

  private _parseTextsFrom(
    document: HTMLDocument,
    selector: string,
  ): string[] {
    return [...document.querySelectorAll(selector)].map((b) =>
      (b as Element).innerText.trim()
    );
  }

  private toDict(devices: Device[]) {
    const dict: DeviceDictionaryWithDuplicates = {};

    // natural sort by id
    devices.sort((a, b) => this.collator.compare(a.id, b.id));

    // array to object
    devices.forEach((device) => {
      if (!Object.keys(dict).includes(device.id)) {
        dict[device.id] = device.name;
      } else if (typeof dict[device.id] === 'string') {
        dict[device.id] = [dict[device.id] as string, device.name]
          .sort();
      } else {
        const array = dict[device.id] as string[];
        array.push(device.name);
        array.sort();
      }
    });

    return dict;
  }
}
