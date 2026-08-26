import { DOMParser, type HTMLDocument } from '@b-fuze/deno-dom';
import type { DeviceDictionaryWithDuplicates } from '../scraper.interface.ts';

interface Device {
  id: string;
  name: string;
}

interface ScrapeOptions {
  locale?: string;
}

const APPLE_SUPPORT_URL = 'https://support.apple.com';
const MAC_IDS = {
  'MacBook': 103257,
  'MacBookAir': 102869,
  'MacBookPro': 108052,
  'iMac': 108054,
  'MacMini': 102852,
  'MacStudio': 102231,
  'MacPro': 102887,
};

export class AppleWebsiteScraper {
  private collator = new Intl.Collator(undefined, {
    numeric: true,
    sensitivity: 'base',
  });
  private domParser = new DOMParser();

  async scrape({ locale = 'en-US' }: ScrapeOptions = {}) {
    const urls = Object.values(MAC_IDS).map((id) =>
      `${APPLE_SUPPORT_URL}/${locale.toLowerCase()}/${id}`
    );
    const devices = await this.loadDevicesFromUrls(urls);
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
    // "MacBook" is the only page still using the old layout as of 2024
    const isRenewed = this._isRenewedWebsite(document);
    if (!isRenewed) {
      console.log('[DEBUG] old website detected');
    }

    const devices = isRenewed
      ? this._parseDevicesFromSections(document)
      : this._parseDevicesFromParagraphs(document);

    // an empty result means the layout changed in a way we no longer understand,
    // so fail loudly instead of silently wiping the existing identifiers
    if (devices.length === 0) {
      throw new Error('no devices found. the website layout may have changed.');
    }

    return devices;
  }

  private _isRenewedWebsite(document: HTMLDocument): boolean {
    // the 2024 renewed website labels every field with a bold text ending
    // with a colon, e.g. "Model Identifier:"
    return this._parseTextsFrom(document, 'p.gb-paragraph b')
      .some((text) => text.endsWith(':') || text.endsWith('：')); // japanese colon
  }

  /**
   * The renewed website puts a device name in a heading and its identifiers in
   * the paragraphs below it, so we walk the document in order and bind each
   * paragraph to the nearest heading above it. Headings that own no identifier
   * (e.g. "Learn more") simply contribute no device.
   */
  private _parseDevicesFromSections(document: HTMLDocument): Device[] {
    const devices: Device[] = [];
    let name: string | undefined;

    for (
      const node of document.querySelectorAll('h2.gb-header, p.gb-paragraph')
    ) {
      const text = node.textContent.trim();

      if (node.localName === 'h2') {
        name = text;
        continue;
      }

      // paragraphs before the first heading belong to no device
      if (name === undefined) continue;

      const deviceName = name;
      for (const id of this._parseIdsFrom(text)) {
        devices.push({ id, name: deviceName });
      }
    }

    return devices;
  }

  /**
   * The old website has no heading per device: a paragraph holding nothing but
   * a bold text names the device, and the paragraphs after it carry its
   * identifiers. So we walk the paragraphs and bind them the same way.
   */
  private _parseDevicesFromParagraphs(document: HTMLDocument): Device[] {
    const devices: Device[] = [];
    let name: string | undefined;

    for (const paragraph of document.querySelectorAll('p.gb-paragraph')) {
      const text = paragraph.textContent.trim();
      const bold = paragraph.querySelector('b')?.textContent.trim();

      if (bold && bold === text) {
        name = bold;
        continue;
      }

      // paragraphs before the first name belong to no device
      if (name === undefined) continue;

      const deviceName = name;
      for (const id of this._parseIdsFrom(text)) {
        devices.push({ id, name: deviceName });
      }
    }

    return devices;
  }

  private _parseIdsFrom(text: string): string[] {
    return text.match(/[A-Za-z]+\d+,\d+/g) ?? [];
  }

  private _parseTextsFrom(
    document: HTMLDocument,
    selector: string,
  ): string[] {
    return [...document.querySelectorAll(selector)].map((element) =>
      element.textContent.trim()
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
