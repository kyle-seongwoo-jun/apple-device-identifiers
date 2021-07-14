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

async function loadDevicesFrom(url: string) {
    const html = await fetch(url).then(res => res.text())
    const matches = [...html.matchAll(/<strong>([^<]+?)(<br>\n |&nbsp;)?<\/strong>(.+\n)?(.+\n)?(.+\n)?Model Identifier:(&nbsp;| )(.+?)(&nbsp;)?<br>/g)]

    const devices: Device[] = []
    matches.forEach(group => {
        const ids = group[7].replace('&nbsp;', ' ').replace(';', ',').split(', ')
        const name = group[1]
        ids.forEach(id => devices.push({ id, name }))
    })

    return devices
}

function toDict(devices: Device[]) {
    const dict: DeviceDictionary = {}

    const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })
    devices.sort((a, b) => collator.compare(a.id, b.id))

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
const json = JSON.stringify(dict, null, 4)
await Deno.writeTextFile('mac-device-identifiers.json', json)

console.log('generated.')
