const SOURCE_FILE = 'mac-device-identifiers.json'
const DEST_FILE = 'mac-device-identifiers-unique.json'

const sourceJsonString = Deno.readTextFileSync(SOURCE_FILE)
const destJsonString = Deno.readTextFileSync(DEST_FILE)

const sourceDict = JSON.parse(sourceJsonString) as { [key: string]: string | string[] }
const destDict = JSON.parse(destJsonString) as { [key: string]: string }

// migrate source to dest
const conflicts: [string, string[]][] = []
const deletedKeys = new Set(Object.keys(destDict))
Object.entries(sourceDict).forEach(([key, value]) => {
    if (typeof value === 'string') {
        // add or update
        destDict[key] = value
    } else if (key in destDict) {
        // already migrated
    } else {
        destDict[key] = "YOU NEED TO MIGRATE THIS DEVICE MANUALLY"
        conflicts.push([key, value])
    }
    deletedKeys.delete(key)
})
// remove deleted items
deletedKeys.forEach(key => delete destDict[key])
// warn about conflicts
conflicts.forEach(([key, value]) => {
    console.warn(`[WARN] ${key} has multiple values: ${value}`)
})

// sort by keys
const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })
const sortedKeys = [...Object.keys(destDict)].sort((a, b) => collator.compare(a, b))
const sortedDict = {} as { [key: string]: string }
sortedKeys.forEach(key => sortedDict[key] = destDict[key])

// write to file
const json = JSON.stringify(sortedDict, null, 2)
await Deno.writeTextFile(DEST_FILE, json)

console.log(conflicts.length > 0 ? 'done with conflict.' : 'done.')
Deno.exit(conflicts.length > 0 ? 1 : 0)
