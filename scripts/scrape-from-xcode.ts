async function getJSON(platform: string) {
    const process = Deno.run({ cmd: ["bash", "-c", `scripts/scrape-from-xcode.sh ${platform}`], stdout: "piped" });
    const output = await process.output().then((o) => new TextDecoder().decode(o));
    const obj = JSON.parse(output);
    return obj as { [key: string]: string };
}

async function generateJsonFile(platform: { name: string; file: string }) {
    const json = await getJSON(platform.name);

    // natural sort
    const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
    const sortedKeys = [...Object.keys(json)].sort((a, b) => collator.compare(a, b));
    const sortedDict = {} as { [key: string]: string };
    sortedKeys.forEach((key) => (sortedDict[key] = json[key]));

    const jsonStr = JSON.stringify(sortedDict, null, 2);
    await Deno.writeTextFile(platform.file, jsonStr);
}

const platforms = [
    { name: "iPhoneOS", file: "ios-device-identifiers.json" },
    { name: "WatchOS", file: "watchos-device-identifiers.json" },
    { name: "AppleTVOS", file: "tvos-device-identifiers.json" },
];
await Promise.all(platforms.map((p) => generateJsonFile(p)));
