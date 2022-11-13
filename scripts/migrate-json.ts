const jsonString1 = Deno.readTextFileSync('mac-device-identifiers.json')
const jsonString2 = Deno.readTextFileSync('mac-device-identifiers-unique.json')

const dict1 = JSON.parse(jsonString1) as { [key: string]: string | string[] }
const dict2 = JSON.parse(jsonString2) as { [key: string]: string }

const keys1 = new Set(Object.keys(dict1))
const keys2 = new Set(Object.keys(dict2))

// check if all keys in dict1 are in dict2
const newKeys = new Set([...keys1].filter(x => !keys2.has(x)))
if (newKeys.size === 0) {
    console.log('there is no new device identifier.')
    console.log('done.')
    Deno.exit(0)
}

// add new keys to dict2
newKeys.forEach(key => {
    const value = dict1[key]
    if (typeof value === 'string') {
        dict2[key] = value
    } else {
        dict2[key] = "YOU NEED TO MIGRATE THIS DEVICE MANUALLY"
        console.warn(`[WARN] ${key} has multiple values: ${value}`)
    }
})

// sort keys
const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })
const sortedKeys = [...Object.keys(dict2)].sort((a, b) => collator.compare(a, b))
const sortedDict = {} as { [key: string]: string }
sortedKeys.forEach(key => sortedDict[key] = dict2[key])

// write to file
const json = JSON.stringify(sortedDict, null, 2)
await Deno.writeTextFile('mac-device-identifiers-unique.json', json)

console.log('done.')