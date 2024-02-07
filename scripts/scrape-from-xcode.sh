#!/bin/bash

# Scrape device_traits.db from Xcode to get a list of all device types

# Usage: ./scrape-from-xcode.sh <platform>
# Example: ./scrape-from-xcode.sh iPhoneOS

# Requires jq: https://stedolan.github.io/jq/
# Requires sqlite3: https://www.sqlite.org/index.html
# Tested with Xcode 14.3.1

# Platform: iPhoneOS | AppleTVOS | WatchOS | XROS
PLATFORM=$1

if [ -z "$PLATFORM" ]; then
    echo "Usage: $0 <platform>"
    exit 1
fi

if [ "$PLATFORM" != "iPhoneOS" ] && [ "$PLATFORM" != "AppleTVOS" ] && [ "$PLATFORM" != "WatchOS" ] && [ "$PLATFORM" != "XROS" ]; then
    echo "Error: Invalid platform: $PLATFORM"
    exit 1
fi

XCODE_PATH=$(xcode-select -p) # /Applications/Xcode.app/Contents/Developer
DB_FILE="$XCODE_PATH/Platforms/$PLATFORM.platform/usr/standalone/device_traits.db"

if [ ! -f "$DB_FILE" ]; then
    echo "Error: $DB_FILE not found"
    exit 1
fi

QUERY="SELECT ProductType as key, ProductDescription as value FROM Devices"

json=$(sqlite3 "$DB_FILE" "$QUERY" -json | jq -r 'map({(.key): .value}) | add')
echo "$json" 
