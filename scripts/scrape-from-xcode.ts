import { sortDictionary } from "./sort.ts";

async function scrapeFromXcode(platform: string) {
    const command = new Deno.Command("bash", { args: ["-c", `scripts/scrape-from-xcode.sh ${platform}`], stdout: "piped" });
    const output = await command.output().then((o) => new TextDecoder().decode(o.stdout));
    const obj = JSON.parse(output) as { [key: string]: string };
    return obj;
}

function cleanUp(dict: { [key: string]: string }) {
    const newDict = {} as { [key: string]: string };
    Object.keys(dict).forEach((key) => {
        // remove suffix: iPad14,3-A to iPad14,3
        const newKey = key.includes("-") ? key.split("-")[0] : key;
        if (key !== newKey) {
            console.info(`Renamed: "${key}" to "${newKey}": "${dict[key]}"`);
        }

        // skip *Family*: MacFamily, RealityFamily
        if (newKey.includes("Family")) {
            console.info(`Skipped: "${newKey}": "${dict[key]}"`);
            return;
        }

        newDict[newKey] = dict[key];
    });
    return newDict;
}

async function generateJsonFile(platform: { name: string; file: string }) {
    console.log(`Generating ${platform.file}...`);
    const dict = await scrapeFromXcode(platform.name).then(cleanUp);

    console.log(`Merging with previous ${platform.file}...`);
    const old = await Deno.readTextFile(platform.file)
        .catch(() => "{}")
        .then((s) => JSON.parse(s) as { [key: string]: string });
    const merged = { ...dict, ...old };
    const sorted = sortDictionary(merged, { ios: platform.name === "iPhoneOS" });

    console.log(`Writing ${platform.file}...`);
    const json = JSON.stringify(sorted, null, 2);
    await Deno.writeTextFile(platform.file, json);
}

const platforms = [
    { name: "iPhoneOS", file: "ios-device-identifiers.json" },
    { name: "WatchOS", file: "watchos-device-identifiers.json" },
    { name: "AppleTVOS", file: "tvos-device-identifiers.json" },
    { name: "XROS", file: "visionos-device-identifiers.json" },
];
await Promise.all(platforms.map((p) => generateJsonFile(p)));

console.log("Done!");