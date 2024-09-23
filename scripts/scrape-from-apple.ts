import { DOMParser, Element, HTMLDocument } from './deps.ts'

interface Device {
    id: string,
    name: string,
}

interface DeviceDictionary {
    [id: string]: string | string[]
}

class AppleWebsiteParser {
    private MODEL_IDENTIFIER = 'Model Identifier: '
    private collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })

    public async loadDevicesFrom(url: string): Promise<Device[]>
    public async loadDevicesFrom(urls: string[]): Promise<Device[]>
    public async loadDevicesFrom(urlOrUrls: string | string[]): Promise<Device[]> {
        if (typeof urlOrUrls === 'string') {
            return this._loadDevicesFrom(urlOrUrls)
        } else {
            return ([] as Device[]).concat(
                ...await Promise.all(urlOrUrls.map(url => this._loadDevicesFrom(url)))
            )
        }
    }

    private async _loadDevicesFrom(url: string): Promise<Device[]> {
        // request HTML from URL
        const html = await fetch(url).then(res => res.text())
        const document = new DOMParser().parseFromString(html, 'text/html')

        if (!document) {
            console.error('[ERROR] failed to parse HTML from', url)
            return []
        }

        const pageTitle = document.querySelector('.gb-header')?.innerText
        console.log(`[INFO] parsing ${url} (${pageTitle})`)

        try {
            const devices = this.parseDevicesFrom(document)
            console.log(`[INFO] parsed ${devices.length} devices from ${url}`)
            return devices
        } catch (e) {
            console.error('[ERROR] failed to parse HTML from', url, 'error:', e)
            return []
        }
    }

    private parseDevicesFrom(document: HTMLDocument): Device[] {
        const names = this.parseNamesFrom(document)
        const ids = this.parseIdsFrom(document)
        if (names.length !== ids.length) {
            throw new Error('names and ids are not matched')
        }

        const devices = names.map((name, i) => {
            const id = ids[i]
            return id.split(/; |, /).map(id => ({ id, name }))
        }).flat()

        return devices
    }

    private parseNamesFrom(document: HTMLDocument): string[] {
        const names = this.parseTextsFrom(document, 'p.gb-paragraph b')

        // if there's a colon at the end of these field, it's 2024 renewed website
        // so we need to parse names in new way
        const is2024Renewed = names.some(name => name.endsWith(':'))
        if (is2024Renewed) {
            const names = this.parseTextsFrom(document, 'h2.gb-header')
            return names
        }

        return names
    }

    private parseIdsFrom(document: HTMLDocument): string[] {
        const ids = this.parseTextsFrom(document, 'p.gb-paragraph')
            .filter(text => text.startsWith(this.MODEL_IDENTIFIER))
            .map(text => text.replace(this.MODEL_IDENTIFIER, ''))

        return ids
    }

    private parseTextsFrom(document: HTMLDocument, selector: string): string[] {
        return [...document.querySelectorAll(selector)].map(b => (b as Element).innerText.trim())
    }

    public toDict(devices: Device[]) {
        const dict: DeviceDictionary = {}

        // natural sort by id
        devices.sort((a, b) => this.collator.compare(a.id, b.id))

        // array to object
        devices.forEach(device => {
            if (!Object.keys(dict).includes(device.id)) {
                dict[device.id] = device.name
            } else if (typeof dict[device.id] === "string") {
                dict[device.id] = [dict[device.id] as string, device.name].sort()
            } else {
                const array = dict[device.id] as string[]
                array.push(device.name)
                array.sort()
            }
        })

        return dict
    }
}

const MAC_WEBSITES = {
    'MacBook': 'https://support.apple.com/en-us/HT201608',
    'MacBook Air': 'https://support.apple.com/en-us/HT201862',
    'MacBook Pro': 'https://support.apple.com/en-us/HT201300',
    'iMac': 'https://support.apple.com/en-us/HT201634',
    'Mac mini': 'https://support.apple.com/en-us/HT201894',
    'Mac Pro': 'https://support.apple.com/en-us/HT202888',
}

console.log('generating...')

const parser = new AppleWebsiteParser()
const devices = await parser.loadDevicesFrom(Object.values(MAC_WEBSITES))
const dict = parser.toDict(devices)
const json = JSON.stringify(dict, null, 2)
await Deno.writeTextFile('mac-device-identifiers.json', json)

console.log('generated.')
