async function scrapeFromXcode(platform: string) {
    const process = Deno.run({ cmd: ["bash", "-c", `scripts/scrape-from-xcode.sh ${platform}`], stdout: "piped" });
    const output = await process.output().then((o) => new TextDecoder().decode(o));
    const obj = JSON.parse(output) as { [key: string]: string };
    return obj;
}

function removeSuffix(dict: { [key: string]: string }) {
    const newDict = {} as { [key: string]: string };
    Object.keys(dict).forEach((key) => {
        const newKey = key.includes("-") ? key.split("-")[0] : key;
        newDict[newKey] = dict[key];
    });
    return newDict;
}

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
const simulators = ['i386', 'x86_64', 'arm64'];
function compare(a: string, b: string) {
    // Sort simulators to the top
    if (simulators.includes(a) && simulators.includes(b)) {
        return simulators.indexOf(a) - simulators.indexOf(b);
    } else if (simulators.includes(a)) {
        return -1;
    } else if (simulators.includes(b)) {
        return 1;
    }
    return collator.compare(a, b);
}

function sort(dict: { [key: string]: string }) {
    const sortedKeys = [...Object.keys(dict)].sort(compare);
    const sortedDict = {} as { [key: string]: string };
    sortedKeys.forEach((key) => (sortedDict[key] = dict[key]));
    return sortedDict;
}

async function generateJsonFile(platform: { name: string; file: string }) {
    console.log(`Generating ${platform.file}...`);
    const dict = await scrapeFromXcode(platform.name).then(removeSuffix);

    console.log(`Merging with previous ${platform.file}...`);
    const old = await Deno.readTextFile(platform.file)
        .catch(() => "{}")
        .then((s) => JSON.parse(s) as { [key: string]: string });
    const merged = { ...dict, ...old };
    const sorted = sort(merged);

    console.log(`Writing ${platform.file}...`);
    const json = JSON.stringify(sorted, null, 2);
    await Deno.writeTextFile(platform.file, json);
}

const platforms = [
    { name: "iPhoneOS", file: "ios-device-identifiers.json" },
    { name: "WatchOS", file: "watchos-device-identifiers.json" },
    { name: "AppleTVOS", file: "tvos-device-identifiers.json" },
];
await Promise.all(platforms.map((p) => generateJsonFile(p)));

console.log("Done!");