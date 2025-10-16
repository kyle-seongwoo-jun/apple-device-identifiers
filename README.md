# apple-device-identifiers

JSON files for mapping iOS, iPadOS, tvOS, watchOS, visionOS and macOS device identifiers to some human readable equivalent.

## Usage

You can download JSON files from the repository.

```shell
curl https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/main/ios-device-identifiers.json > ios-device-identifiers.json
```

Here is a simple example using the JSON file with bash and [jq](https://stedolan.github.io/jq/).

```shell
function get_apple_device_name() {
  local URL="https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/main"
  local OS="$1" # ios, tvos, watchos, visionos, mac
  local IDENTIFIER="$2"
  curl "$URL/$OS-device-identifiers.json" | jq -r ".[\"$IDENTIFIER\"]"
}

$ get_apple_device_name ios iPhone16,1
iPhone 15 Pro

$ get_apple_device_name mac Mac15,11
MacBook Pro (16-inch, Nov 2023)
```

## Generate JSON file

```shell
# iOS, iPadOS, tvOS, watchOS, visionOS
deno run start:scrape-from-xcode

# macOS (OpenAI is optional, it needs to generate `mac-device-identifiers-unique.json`)
OPENAI_API_KEY=... \
OPENAI_MODEL=... \
deno run start:scrape-from-apple
```

## References (iOS, iPadOS, tvOS, watchOS)

- [Identify your iPhone model](https://support.apple.com/en-us/108044)
- [Identify your iPad model](https://support.apple.com/en-us/108043)
- [Identify your iPod model](https://support.apple.com/en-us/103823)
- [Identify your Apple Watch](https://support.apple.com/en-us/108056)
- [Identify your Apple TV model](https://support.apple.com/en-us/101605)

## Sources (macOS)

- [Identify your MacBook model](https://support.apple.com/en-us/103257)
- [Identify your MacBook Air model](https://support.apple.com/en-us/102869)
- [Identify your MacBook Pro model](https://support.apple.com/en-us/108052)
- [Identify your iMac model](https://support.apple.com/en-us/108054)
- [Identify your Mac mini model](https://support.apple.com/en-us/102852)
- [Identify your Mac Studio model](https://support.apple.com/en-us/102231)
- [Identify your Mac Pro model](https://support.apple.com/en-us/102887)
