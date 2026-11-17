#!/bin/sh
# fetch.sh <out> <url> : download one image with a polite UA, retry on 429.
for i in 1 2 3 4 5; do
  code=$(/usr/bin/curl -sL -A "beforegta6-image-research/1.0" -o "$1" -w '%{http_code}' "$2")
  [ "$code" = 200 ] && { echo "ok $1"; exit 0; }
  sleep $((i*8))
done
echo "FAIL $code $1"; exit 1
