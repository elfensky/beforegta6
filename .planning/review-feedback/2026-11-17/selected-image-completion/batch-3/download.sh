#!/bin/zsh
# Download each id's Commons thumbnail into assets/. Args: meta.json id...
B=${0:a:h}; M=$1; shift
for id in "$@"; do
  u=$(python3 -I -c "import json,sys;r=json.load(open(sys.argv[1]))[sys.argv[2]];print(r['thumb'] or r['url'])" $M $id)
  ext=${u:e:l}; [[ $ext == jpeg ]] && ext=jpg
  for n in 1 2 3 4 5; do
    code=$(/usr/bin/curl -s -L -A "beforegta6-image-research/1.0 (personal site)" -o $B/assets/$id.$ext -w '%{http_code}' "$u")
    [[ $code == 200 ]] && break; sleep $((n*10))
  done
  echo "$id $code $u"; sleep 3
done
