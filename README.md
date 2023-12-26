# apple-device-identifiers

JSON files for mapping iOS, iPadOS, tvOS, watchOS, and macOS device identifiers to some human readable equivalent.

## Usage

You can download JSON files from the repository.

```shell
curl https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/main/ios-device-identifiers.json > ios-device-identifiers.json
```

Here is a simple example using the JSON file with bash and [jq](https://stedolan.github.io/jq/).

```shell
function get_apple_device_name() {
  local URL="https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/main"
  local OS="$1" # ios, tvos, watchos, mac
  local IDENTIFIER="$2"
  curl "$URL/$OS-device-identifiers.json" | jq -r ".[\"$IDENTIFIER\"]"
}

$ get_apple_device_name ios iPhone16,1
iPhone 15 Pro

$ get_apple_device_name mac Mac15,11
MacBook Pro (16-inch, Nov 2023)
```

## Genrerate JSON file

```shell
# iOS, iPadOS, tvOS, watchOS
deno run --allow-run --allow-read --allow-write scripts/scrape-from-xcode.ts

# macOS
deno run --allow-net --allow-write scripts/scrape-from-apple.ts
deno run --allow-read --allow-write scripts/migrate-json.ts
```

## References (iOS, iPadOS, tvOS, watchOS)

- [Identify your iPhone model](https://support.apple.com/en-us/HT201296)
- [Identify your iPad model](https://support.apple.com/en-us/HT201471)
- [Identify your iPod model](https://support.apple.com/en-us/HT204217)
- [Identify your Apple Watch](https://support.apple.com/en-us/HT204507)
- [Identify your Apple TV model](https://support.apple.com/en-us/HT200008)

## Sources (macOS)

- [Identify your MacBook model](https://support.apple.com/en-us/HT201608)
- [Identify your MacBook Air model](https://support.apple.com/en-us/HT201862)
- [Identify your MacBook Pro model](https://support.apple.com/en-us/HT201300)
- [Identify your iMac model](https://support.apple.com/en-us/HT201634)
- [Identify your Mac mini model](https://support.apple.com/en-us/HT201894)
- [Identify your Mac Pro model](https://support.apple.com/en-us/HT202888)
