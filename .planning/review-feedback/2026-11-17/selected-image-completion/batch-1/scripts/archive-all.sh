#!/bin/sh
# archive-all.sh <urls-file> <log> : archive each URL with the vault script; log "url<TAB>output".
while IFS= read -r u; do
  [ -z "$u" ] && continue
  out=$(~/vault/meta/scripts/archive "$u" beforegta6 2>&1 | tr '\n' ' ')
  printf '%s\t%s\n' "$u" "$out" >> "$2"
done < "$1"
