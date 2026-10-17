# Mastery Math — Grade 7 → Geometry (NYS Next Generation standards), Math-Academy-style mastery learning

**Scope:** Grade 7 (34 topics), Grade 8 (22), Algebra I (46), Geometry (36) = 138 topics. Dashboard (daily XP goal ring, ordered task queue, per-course progress), separate Course map screen (course filter, collapsible units), per-course adaptive placement test. Generators are verified by `node test.js` (≈240k generated problems, independent answer checks); UI by `node e2e.js` (needs jsdom). Build: `python3 build.py` (optionally with SUPABASE_URL/SUPABASE_KEY env), then copy public/index.html to docs/index.html. Topic files: `t_1_g7.js`, `t_2_g8.js`, `t_3_a1.js`, `t_4_geo.js`; standard tags are best-effort labels.


Single self-contained `public/index.html` (vanilla JS, no framework, no build deps beyond Python 3). Works fully offline with
progress in `localStorage`; optional Supabase email+password login with cloud sync (off until configured).

## Layout
| file | purpose |
|---|---|
| `core.js` | helpers, math formatting, answer parsing/checking (numbers, fractions, polynomials, inequalities, ordered pairs, MC) |
| `topics.js` | **the knowledge graph**: 24 topics with `prereqs`, lesson text, and randomized problem generators with worked solutions |
| `engine.js` | pure logic: locking, mastery (5/6), spaced repetition, review queue, diagnostic placement, XP/daily goal/streak, sync merge |
| `app.js` | browser UI (dashboard/map, lessons, practice, review, placement test, settings) + Supabase auth/sync |
| `template.html` | HTML/CSS shell **and the `SUPABASE_URL` / `SUPABASE_KEY` placeholders** |
| `build.py` | inlines everything into `public/index.html` |
| `supabase.sql` | table `public.progress` + row-level security (run once in the Supabase SQL editor) |
| `test.js` | node tests (generators, checker, mastery, spaced repetition, diagnostic, XP/streak, sync merge) |
| `e2e.js` | jsdom smoke test of the *built* page (needs `npm i --no-save jsdom`) |

## Run / build / test
```
python3 build.py            # -> public/index.html  (open it directly in a browser, or: python3 -m http.server -d public)
node test.js                # unit tests (~42k generated problems, ~450k assertions)
npm i --no-save jsdom && node e2e.js   # headless page test
```
Adding content = add a topic object to `TOPICS` in `topics.js` (id, unit, std, title, prereqs, lesson, gens[]); the graph, map, diagnostic, tests all pick it up. Prereqs must appear earlier in the array (checked by tests).

## Learning model
* A topic is **locked** until all prerequisites are mastered. **Mastered** = ≥5 of 6 correct in a fresh randomized set.
* **Review:** mastered topics return after 1 → 3 → 7 → 14 → 30 → 60 → 120 days. A failed review resets to the start of the ladder and flags the topic's direct prerequisites as due now (⚑).
* **Placement test:** probes the most informative topic in the graph (balanced binary search); 2 questions per topic, both must be right; known ⇒ all its prerequisites known, unknown ⇒ everything depending on it unknown. ≤14 topics probed. Placed topics get a first review after 3 days.
* **XP:** 2/correct practice answer, +10 on mastery, 3/correct due review, 1/correct extra mixed practice. Daily goal (default 50, configurable); **streak** = consecutive days the goal was met.

## Supabase + GitHub Pages setup (not done yet — needs accounts/approval)
1. Create a **new** Supabase project (separate from the precalc one). Run `supabase.sql` in SQL Editor.
2. Supabase → Authentication → URL Configuration: set *Site URL* and add the GitHub Pages URL to *Redirect URLs*.
3. Put the project URL and **publishable (anon) key** in `template.html` (`SUPABASE_URL`, `SUPABASE_KEY`) — or build with
   `SUPABASE_URL=https://xxxx.supabase.co SUPABASE_KEY=sb_publishable_xxx python3 build.py`. Never use the service_role key.
4. Create a public GitHub repo, commit this folder, serve `public/` (GitHub Pages: Settings → Pages → deploy from branch/folder, or copy `public/index.html` to `docs/` or `/`).
5. With 3–4 students, the default Supabase email sender's low hourly limit is fine (or disable "Confirm email" while testing).
Shared-device safety: the local cache is tagged with the signed-in user id; signing out clears it, and a different user signing in never inherits it.

Standards tags (e.g. `7.NS.1`, `A.REI.3`) are best-effort labels for the NYS Next Generation Math Learning Standards — verify against NYSED's documents before relying on them for alignment claims.
