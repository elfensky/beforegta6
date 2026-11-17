# Commons file search with 429 backoff. Args: query [query...]
import json, sys, time, urllib.parse, urllib.request, urllib.error
for s in sys.argv[1:]:
    q = urllib.parse.urlencode({'action': 'query', 'list': 'search', 'srsearch': s, 'srnamespace': 6, 'srlimit': 12, 'format': 'json'})
    for n in range(8):
        try:
            j = json.load(urllib.request.urlopen(urllib.request.Request('https://commons.wikimedia.org/w/api.php?' + q, headers={'User-Agent': 'beforegta6-image-research/1.0 (personal site)'}), timeout=30)); break
        except urllib.error.HTTPError as e:
            if e.code != 429: raise
            time.sleep(15 * (n + 1))
    print('##', s); [print('  ', r['title']) for r in j['query']['search']]; sys.stdout.flush()
    time.sleep(6)
