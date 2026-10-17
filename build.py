#!/usr/bin/env python3
"""Inline template.html + core.js + topics.js + engine.js + app.js into public/index.html (single self-contained file).
Optional: SUPABASE_URL=... SUPABASE_KEY=... python3 build.py  fills in the (public) Supabase config at build time."""
import os, re
d = os.path.dirname(os.path.abspath(__file__))
rd = lambda f: open(os.path.join(d, f), encoding="utf-8").read()
t = rd("template.html")
url, key = os.environ.get("SUPABASE_URL"), os.environ.get("SUPABASE_KEY")
if url:
    t = re.sub(r'const SUPABASE_URL = "[^"]*";', lambda m: 'const SUPABASE_URL = ' + repr(url).replace("'", '"') + ';', t)
if key:
    t = re.sub(r'const SUPABASE_KEY = "[^"]*";', lambda m: 'const SUPABASE_KEY = ' + repr(key).replace("'", '"') + ';', t)
import glob
FILES = ["core.js", "topics.js"] + sorted(os.path.basename(p) for p in glob.glob(os.path.join(d, "t_*.js"))) + ["tend.js", "engine.js", "app.js"]
js = "\n".join(rd(f) for f in FILES)
html = t + "<script>\n" + js + "\n</script></body></html>\n"
os.makedirs(os.path.join(d, "public"), exist_ok=True)
open(os.path.join(d, "public", "index.html"), "w", encoding="utf-8").write(html)
print("built public/index.html (%d bytes)%s" % (len(html.encode()), " with Supabase config" if (url or key) else " — Supabase placeholders unset (local mode)"))
