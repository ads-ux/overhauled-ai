#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# retrofit-clean-urls.sh
# One-shot normalizer that brings legacy WeProvideLeads / Overhauled.ai
# lead-gen sites into line with SEO-BUILD-SPEC.md §4 (clean/extensionless URLs).
#
# For every repo it:
#   1. clones it (shallow) from GitHub,
#   2. strips ".html" from every internal <a href>, canonical, and og:url,
#      forces internal links to absolute clean form, maps /index -> /,
#   3. rebuilds sitemap.xml in clean form (excludes 404 + thank-you),
#   4. commits + pushes  ->  Netlify auto-redeploys.
#
# Requires: git + gh (or a PAT), python3. Run from a machine logged into GitHub.
#
# USAGE:
#   ./retrofit-clean-urls.sh            # dry run: fixes locally, shows diff, NO push
#   ./retrofit-clean-urls.sh --push     # fix, commit, and push each repo
#
# Edit ORG / REPOS below if the list changes.
# ---------------------------------------------------------------------------
set -euo pipefail

ORG="ads-ux"
PUSH="${1:-}"
WORK="$(mktemp -d)"
echo "Working dir: $WORK"

REPOS=(
  guelphroofers-com guelphairconditioning-com guelphbasementwaterproofing-com
  guelphcommercialcleaning-com guelphhydrovac-com guelphinterlocking-com
  guelphjunkremoval-com guelphmoldremoval-com guelphmovers-com
  guelphgeneralcontractor-com guelphwindowreplacement-com guelphelectrical-com
  guelphdrywalling-com guelphfencing-com
)

# repo "guelphroofers-com" -> domain "guelphroofers.com"
repo_to_domain () { echo "$1" | sed -E 's/-(com|ca|net|org)$/.\1/'; }

normalize_py () {
cat <<'PY'
import re, glob, os, sys
domain = sys.argv[1]

def clean_url(u):
    # leave external / non-navigational links alone
    if re.match(r'^(https?:|mailto:|tel:|#|//)', u):
        # but DO clean our own absolute domain in canonical/og handled separately
        return u
    u = re.sub(r'\.html(?=$|[#?])', '', u)          # drop .html
    if not u.startswith('/'):                        # force absolute
        u = '/' + u
    u = re.sub(r'/index$', '/', u)                   # /index -> /
    return u or '/'

def fix_hrefs(s):
    return re.sub(r'href="([^"]*)"',
                  lambda m: 'href="%s"' % clean_url(m.group(1)), s)

def fix_absolute_self(s):
    # canonical + og:url that point at our own domain: strip .html and /index
    pat = re.compile(r'(https://%s/[^"]*?)(\.html)?(?="|#)' % re.escape(domain))
    def rp(m):
        base = re.sub(r'\.html$', '', m.group(1))
        base = re.sub(r'/index$', '/', base)
        return base
    return pat.sub(rp, s)

changed = 0
for f in glob.glob("**/*.html", recursive=True):
    s = open(f, encoding="utf-8", errors="replace").read()
    o = s
    s = fix_hrefs(s)
    s = fix_absolute_self(s)
    if s != o:
        open(f, "w", encoding="utf-8").write(s); changed += 1
print("  html normalized:", changed)

# rebuild sitemap.xml (clean URLs, exclude 404 + thank-you)
paths = []
for f in sorted(glob.glob("**/*.html", recursive=True)):
    base = os.path.basename(f)
    if base in ("404.html", "thank-you.html"): continue
    rel = f[:-5]                      # strip .html
    rel = re.sub(r'(^|/)index$', r'\1', rel)
    loc = "https://%s/%s" % (domain, rel.lstrip("/"))
    loc = loc.rstrip("/") + ("/" if rel in ("", "index") or f == "index.html" else "")
    paths.append(loc)
# de-dupe, ensure homepage present once as domain/
paths = sorted(set(p if p != "https://%s" % domain else "https://%s/" % domain for p in paths))
sm = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
sm += "".join('  <url><loc>%s</loc></url>\n' % p for p in paths)
sm += '</urlset>\n'
open("sitemap.xml", "w", encoding="utf-8").write(sm)
print("  sitemap urls:", len(paths))
PY
}

for repo in "${REPOS[@]}"; do
  domain="$(repo_to_domain "$repo")"
  echo "=================================================================="
  echo "  $repo  ($domain)"
  echo "=================================================================="
  gh repo clone "$ORG/$repo" "$WORK/$repo" -- --depth 1 >/dev/null 2>&1 \
    || git clone --depth 1 "https://github.com/$ORG/$repo.git" "$WORK/$repo" >/dev/null 2>&1
  ( cd "$WORK/$repo"
    python3 <(normalize_py) "$domain"
    # quick verification
    left=$(grep -rlE 'href="[^"]*\.html"|canonical[^>]*\.html"' --include=*.html . | wc -l | tr -d ' ')
    echo "  files still containing .html links/canonicals: $left  (expect 0)"
    if git diff --quiet; then
      echo "  no changes (already clean)"
    elif [ "$PUSH" = "--push" ]; then
      git add -A
      git commit -q -m "SEO: normalize to clean/extensionless URLs (canonical, og:url, internal links, sitemap) per SEO-BUILD-SPEC §4"
      git push -q && echo "  ✔ pushed — Netlify will redeploy"
    else
      echo "  (dry run) changes staged locally; re-run with --push to publish"
      git --no-pager diff --stat | tail -3
    fi
  )
done

echo
echo "Done. Working copies in: $WORK"
[ "$PUSH" != "--push" ] && echo "Dry run only — no repos were pushed. Re-run with --push to publish."
