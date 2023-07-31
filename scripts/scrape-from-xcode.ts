async function scrapeFromXcode(platform: string) {
    const process = Deno.run({ cmd: ["bash", "-c", `scripts/scrape-from-xcode.sh ${platform}`], stdout: "piped" });
    const output = await process.output().then((o) => new TextDecoder().decode(o));
    const obj = JSON.parse(output);
    return obj as { [key: string]: string };
}

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
function naturalSort(dict: { [key: string]: string }) {
    const sortedKeys = [...Object.keys(dict)].sort((a, b) => collator.compare(a, b));
    const sortedDict = {} as { [key: string]: string };
    sortedKeys.forEach((key) => (sortedDict[key] = dict[key]));
    return sortedDict;
}

async function generateJsonFile(platform: { name: string; file: string }) {
    console.log(`Generating ${platform.file}...`);
    const dict = await scrapeFromXcode(platform.name).then(naturalSort);

    console.log(`Writing ${platform.file}...`);
    const json = JSON.stringify(dict, null, 2);
    await Deno.writeTextFile(platform.file, json);
}

const platforms = [
    { name: "iPhoneOS", file: "ios-device-identifiers.json" },
    { name: "WatchOS", file: "watchos-device-identifiers.json" },
    { name: "AppleTVOS", file: "tvos-device-identifiers.json" },
];
await Promise.all(platforms.map((p) => generateJsonFile(p)));

console.log("Done!");