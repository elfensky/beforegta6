"""Commons file search. Usage: search.py 'query' ..."""
import json, sys, time, urllib.parse, urllib.request, urllib.error
for q in sys.argv[1:]:
    u = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode({"action":"query","format":"json","list":"search","srnamespace":6,"srlimit":15,"srsearch":q})
    for a in range(6):
        try: d = json.load(urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent":"image-research-script/1.0"}), timeout=30)); break
        except urllib.error.HTTPError as e:
            if e.code != 429: raise
            time.sleep(10*(a+1))
    print("##", q)
    for r in d["query"]["search"]: print("  ", r["title"])
    time.sleep(3)
