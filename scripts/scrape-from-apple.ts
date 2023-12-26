import { DOMParser, Element, HTMLDocument } from './deps.ts'

interface Device {
    id: string,
    name: string,
}

interface DeviceDictionary {
    [id: string]: string | string[]
}

const websites = {
    'MacBook': 'https://support.apple.com/en-us/HT201608',
    'MacBook Air': 'https://support.apple.com/en-us/HT201862',
    'MacBook Pro': 'https://support.apple.com/en-us/HT201300',
    'iMac': 'https://support.apple.com/en-us/HT201634',
    'Mac mini': 'https://support.apple.com/en-us/HT201894',
    'Mac Pro': 'https://support.apple.com/en-us/HT202888',
}

async function loadDevicesFrom(url: string): Promise<Device[]> {
    // request HTML from URL
    const html = await fetch(url).then(res => res.text())
    const document = new DOMParser().parseFromString(html, 'text/html')

    if (!document) {
        console.error('[ERROR] failed to parse HTML from', url)
        return []
    }

    const header = document.querySelector('.gb-header')?.innerText
    const isNewPage = header !== undefined
    console.log(`[INFO] parsing ${url} (${isNewPage ? `new, ${header}` : 'old'})`)

    try {
        const devices = isNewPage ? parseNewPage(document) : parseOldPage(document)
        console.log(`[INFO] parsed ${devices.length} devices from ${url}`)
        return devices
    } catch (e) {
        console.error('[ERROR] failed to parse HTML from', url, 'error:', e)
        return []
    }
}

function parseOldPage(document: HTMLDocument): Device[] {
    const div = document.querySelector('#sections')
    if (!div) {
        throw new Error('failed to find #sections element')
    }

    // parse with regexp
    const html = div.innerHTML.replaceAll('&nbsp;', ' ')
    const matches = [...html.matchAll(/<strong>([^<]+?)(<br>\n)? ?<\/strong>(.+\n)?(.+\n)?(.+\n)?Model Identifier: (.+?) ?<br>/g)]

    const devices: Device[] = []
    matches.forEach(group => {
        const ids = group[6].replace(';', ',').split(', ')
        const name = group[1]
        ids.forEach(id => devices.push({ id, name }))
    })

    return devices
}

function parseNewPage(document: HTMLDocument): Device[] {
    const MODEL_IDENTIFIER = 'Model Identifier: '

    const names = [...document.querySelectorAll('p.gb-paragraph b')].map(b => (b as Element).innerText.trim())
    const ids = [...document.querySelectorAll('p.gb-paragraph')].filter(p => (p as Element).innerText.startsWith(MODEL_IDENTIFIER)).map(p => (p as Element).innerText.replace(MODEL_IDENTIFIER, ''))

    if (names.length !== ids.length) {
        throw new Error('names and ids are not matched')
    }

    const devices = names.map((name, i) => {
        let id = ids[i]

        // Apple might have temporarily miswritten the document, as currently, on https://support.apple.com/en-us/102852,
        // there is no line break between Model Identifier and Part Numbers in the description of the Mac mini (2023) model.
        // Therefore, a separate handling for this model has been added
        // (planned to be removed when the document is updated).
        if (id.includes('Part Numbers:')) {
            id = id.split('Part Numbers:')[0].trim()
        }

        // some devices have multiple identifiers
        return id.split('; ').map(id => ({ id, name }))
    }).flat()

    return devices
}

function toDict(devices: Device[]) {
    const dict: DeviceDictionary = {}

    // natural sort by id
    const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })
    devices.sort((a, b) => collator.compare(a.id, b.id))

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

console.log('generating...')

const devices = ([] as Device[]).concat(
    ...await Promise.all(
        Object.values(websites).map(url => loadDevicesFrom(url))
    )
)
const dict = toDict(devices)
const json = JSON.stringify(dict, null, 2)
await Deno.writeTextFile('mac-device-identifiers.json', json)

console.log('generated.')
