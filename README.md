# mac-device-identifiers

A json file for mapping macOS device identifiers to some human readable equivalent.

## Genrerate JSON file

```shell
# iOS, iPadOS, tvOS, watchOS
deno run --allow-run --allow-write scripts/scrape-from-xcode.ts

# macOS
deno run --allow-net --allow-write scripts/scrape-from-apple.ts
deno run --allow-read --allow-write scripts/migrate-json.ts
```

## Source

- [Identify your MacBook model](https://support.apple.com/en-us/HT201608)
- [Identify your MacBook Air model](https://support.apple.com/en-us/HT201862)
- [Identify your MacBook Pro model](https://support.apple.com/en-us/HT201300)
- [Identify your iMac model](https://support.apple.com/en-us/HT201634)
- [Identify your Mac mini model](https://support.apple.com/en-us/HT201894)
- [Identify your Mac Pro model](https://support.apple.com/en-us/HT202888)

## See also

- [fieldnotescommunities/ios-device-identifiers](https://github.com/fieldnotescommunities/ios-device-identifiers)
