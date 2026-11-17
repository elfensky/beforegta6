# Query Commons imageinfo + extmetadata for File: titles in one request (retry on 429); save raw JSON.
import json, sys, time, urllib.parse, urllib.request, urllib.error
out = sys.argv[1]
titles = sys.argv[2:]
q = urllib.parse.urlencode({"action":"query","format":"json","titles":"|".join(titles),"prop":"imageinfo",
    "iiprop":"url|size|sha1|extmetadata|mime","iiurlwidth":"1280","maxlag":"5"})
req = urllib.request.Request("https://commons.wikimedia.org/w/api.php?"+q,
    headers={"User-Agent":"beforegta6-image-research/1.0 (personal site; contact via site)"})
for i in range(6):
    try:
        d = json.load(urllib.request.urlopen(req)); break
    except urllib.error.HTTPError as e:
        if e.code != 429: raise
        time.sleep(10 * (i + 1))
else:
    sys.exit("rate limited")
pages = d["query"]["pages"]
json.dump(d, open(out, "w"), indent=1)
for p in pages.values():
    t = p["title"]; ii = (p.get("imageinfo") or [{}])[0]; m = ii.get("extmetadata", {})
    g = lambda k: (m.get(k) or {}).get("value", "")
    print("==", t, "MISSING" if "missing" in p else "")
    if ii:
        print(" size", ii.get("width"), ii.get("height"), ii.get("mime"), "| page", ii.get("descriptionurl"))
        print(" thumb", ii.get("thumburl"))
        print(" lic", g("LicenseShortName"), "|", g("UsageTerms"), "| artist:", g("Artist")[:200])
        print(" credit:", g("Credit")[:200], "| date:", g("DateTimeOriginal")[:60])
        print(" desc:", g("ImageDescription")[:300])
        print(" restr:", g("Restrictions"), "| copyrighted:", g("Copyrighted"))
