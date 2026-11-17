"""Query Commons imageinfo + extmetadata for file titles. Usage: commons.py out.json Title1 Title2 ..."""
import json, os, sys, time, urllib.parse, urllib.request, urllib.error
out, titles = sys.argv[1], sys.argv[2:]
res = json.load(open(out)) if os.path.exists(out) else {}
for t in titles:
    q = urllib.parse.urlencode({"action":"query","format":"json","prop":"imageinfo","titles":t,
        "iiprop":"url|size|sha1|mime|extmetadata|user|timestamp","iiurlwidth":1280})
    req = urllib.request.Request("https://commons.wikimedia.org/w/api.php?"+q, headers={"User-Agent":"image-research-script/1.0"})
    for attempt in range(6):
        try:
            d = json.load(urllib.request.urlopen(req, timeout=30)); break
        except urllib.error.HTTPError as e:
            if e.code != 429: raise
            time.sleep(10 * (attempt + 1))
    time.sleep(2)
    p = next(iter(d["query"]["pages"].values()))
    ii = (p.get("imageinfo") or [{}])[0]
    em = {k:v.get("value") for k,v in ii.get("extmetadata",{}).items() if k in ("Artist","LicenseShortName","License","Credit","UsageTerms","ImageDescription","DateTimeOriginal","Restrictions","Copyrighted","AttributionRequired")}
    res[t] = {"missing": "missing" in p, "title": p.get("title"), "url": ii.get("url"), "thumb": ii.get("thumburl"), "w": ii.get("width"), "h": ii.get("height"), "mime": ii.get("mime"), "page": ii.get("descriptionurl"), "uploader": ii.get("user"), "meta": em}
    json.dump(res, open(out,"w"), indent=1, ensure_ascii=False)
    print(t, "MISSING" if "missing" in p else f'{ii.get("width")}x{ii.get("height")} {em.get("LicenseShortName")} | {em.get("Artist","")[:120]}')
