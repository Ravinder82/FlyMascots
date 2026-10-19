# Launch plan — flymascots v1.0.0

Four venues, in order. Each block: what to post, which file to attach, and the
exact copy (all copy lives in `copy/`, all assets are generated — nothing here
needs design work on the day).

**Positioning to hold everywhere:** an agent skill that builds mascots that
feel alive, *and verifies them*. The verification is the differentiator; lead
with the film, land on the harness.

---

## 0. Before anything (one-time)

| Step | Status |
| --- | --- |
| Repo description + homepage + topics (`agent-skills` `claude-skills` `ai-agents` `mascot` `threejs` `scenekit` `spring-physics` `character-animation`) | done 2026-10-19 |
| Tag `v1.0.0` (points at the first npm release) | done 2026-10-19 |
| npm refresh — v1.0.1 publishes the new README over the old one | in progress: publishing (npm login approval) |
| Social preview | **manual** — GitHub → Settings → Social preview → upload `marketing/stills/out/og-card.png`. There is no API for this; GitHub's own community threads confirm it is UI-only. |
| skills.sh page | no submission flow — the leaderboard is driven by anonymous install telemetry (see skills.sh/docs). `skills.sh/Ravinder82/FlyMascots` appears after the first real installs; then add the badge: `[![skills.sh](https://skills.sh/b/Ravinder82/FlyMascots)](https://skills.sh/Ravinder82/FlyMascots)` |
| README check | open the repo README on github.com **and in dark mode** — the pipeline `<picture>` must swap, the film poster must show |

---

## 1. X / Twitter — the thread (day 1, 09:00 your time)

- Attach per post: `renders/flymascots-reel-16x9.mp4` (post 1),
  `stills/out/pipeline-16x9.png` (2), `moods-16x9.png` (3),
  `yt-thumb-b.png` (4), `platforms-square.png` (5), `og-card.png` (6).
- Copy: `copy/social.md` → “X / Twitter thread”.
- Pin post 1. Reply to your own thread only with real answers — no bumping.
- Quote-tweet the thread later with one frame from the film + one line of
  feedback you got.

## 2. Skill directories (day 1–2)

- skills.sh: ensure the customised page is live; the repo is the source, so
  the page picks up `README.md` and `SKILL.md`.
- Post the long description from `copy/social.md` to any curated list you
  already contribute to (awesome-lists etc.) as a normal PR — do not spam
  lists you don't use.
- npm: the package page carries the same description — after the refresh in
  step 0, check the badges render.

## 3. Reddit (day 2–3, stagger the two subreddits by a day)

- **r/ClaudeAI** — copy: `copy/social.md` → “Reddit — r/ClaudeAI”. Post as
  text, put the film link in the body (not a link post).
- **r/webdev** — copy: “Reddit — r/webdev”. Technical angle, same repo.
- Rules that matter: disclose it's yours (both drafts do), answer every
  comment for the first two hours, never argue with a “this is just an ad”
  comment — one calm reply, then move on.

## 4. YouTube Shorts + Instagram Reels (day 3–4)

- Primary upload: `renders/flymascots-reel-9x16.mp4` (24 s, −16.3 LUFS).
- Cover: `renders/qc/poster-reel-9x16.png`.
- Title + caption: `copy/social.md` → “YouTube Shorts / Instagram Reels”.
- Second upload (day 5–6): `renders/flymascots-story-9x16.mp4` (34 s) — the
  same film with the diagram and platform scenes; title “How the mascot
  pipeline works”.
- Pin a comment on both: install line + repo link.

---

## What to watch (and what not to)

- Look at: installs from `npx skills` (if visible on the skills.sh page),
  npm downloads, repo clones vs stars, and *which venue* sent traffic —
  GitHub → Insights → Traffic → Referring sites.
- Do not chase: star counts on day one, or posting the same link to five
  subreddits. One good thread beats five broadcasts.
- If a comment points at something wrong (a claim, a bug, a broken link),
  fix it in the repo the same day and reply with the fix. That is the whole
  brand: claims you can check.

## Assets index (all pre-rendered)

| Asset | File |
| --- | --- |
| Launch film 16:9 / 9:16 | `renders/flymascots-reel-{16x9,9x16}.mp4` |
| Story cut 16:9 / 9:16 | `renders/flymascots-story-{16x9,9x16}.mp4` |
| Posters | `renders/qc/poster-*.png` |
| Launch cards | `stills/out/launch-{16x9,square,portrait}.png` |
| Feature cards | `stills/out/{moods-16x9,pipeline-16x9,platforms-square}.png` |
| OG + thumbnails | `stills/out/{og-card,yt-thumb-a,yt-thumb-b,reel-cover}.png` |
| README stills + reel | `assets/` |
