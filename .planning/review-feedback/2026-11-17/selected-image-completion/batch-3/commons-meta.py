# Query Commons imageinfo + extmetadata. Args: input.json (batch input, or {id: "File:..."} map) out.json
import json, sys, time, urllib.parse, urllib.request, urllib.error, re
inp, out = sys.argv[1], sys.argv[2]
d = json.load(open(inp))
titles = {c['id']: urllib.parse.unquote(c['image_page'].split('/wiki/', 1)[1]).replace('_', ' ') for c in d['candidates']} if 'candidates' in d else d
def get(url):
    for n in range(6):
        try:
            return json.load(urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'beforegta6-image-research/1.0 (personal site)'}), timeout=30))
        except urllib.error.HTTPError as e:
            if e.code != 429: raise
            time.sleep(10 * (n + 1))
    raise SystemExit('rate limited')
strip = lambda s: re.sub(r'<[^>]+>', '', s or '').strip()
res = {}
for cid, title in titles.items():
    q = urllib.parse.urlencode({'action': 'query', 'titles': title, 'prop': 'imageinfo', 'iiprop': 'url|size|mime|extmetadata|sha1', 'iiurlwidth': 1280, 'format': 'json', 'redirects': 1})
    j = get('https://commons.wikimedia.org/w/api.php?' + q)
    p = next(iter(j['query']['pages'].values()))
    ii = (p.get('imageinfo') or [{}])[0]
    m = ii.get('extmetadata', {})
    g = lambda k: (m.get(k) or {}).get('value')
    res[cid] = {'title': p.get('title'), 'missing': 'missing' in p, 'url': (ii.get('url') or '').split('?')[0], 'thumb': (ii.get('thumburl') or '').split('?')[0], 'w': ii.get('width'), 'h': ii.get('height'), 'mime': ii.get('mime'), 'page': ii.get('descriptionurl'), 'license': g('LicenseShortName'), 'artist': strip(g('Artist')), 'credit': strip(g('Credit'))[:200], 'desc': strip(g('ImageDescription'))[:300], 'date': strip(g('DateTimeOriginal')), 'restrictions': g('Restrictions'), 'categories': strip(g('Categories'))[:300]}
    r = res[cid]; print(cid, '|', r['title'], '|', r['w'], r['h'], r['mime'], '|', r['license'], '|', r['artist'][:80], '|', r['credit'][:80], '|', r['desc'][:150], '|', r['restrictions'], '\n')
    time.sleep(2)
json.dump(res, open(out, 'w'), indent=1, ensure_ascii=False)
