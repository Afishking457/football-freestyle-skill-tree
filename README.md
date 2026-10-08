# Freestyle 130 — Football Skill Tree

A responsive, installable web app with **130 freestyle football challenges** and suggested prerequisites, grouped into Foundations, Lowers, Uppers, Sitdowns, Stalls & Blocks, and Transitions. No account, npm, framework, or API key needed.

## Files

- `index.html` — page structure
- `style.css` — styling, mobile layout
- `data.js` — full trick catalogue; edit to add or change skills
- `app.js` — skill tree, library, save/import/export, filters
- `manifest.webmanifest`, `sw.js`, `icons/` — home-screen installation and offline support
- `standalone.html` — optional all-in-one version; works as a local file, but does not support PWA installation

## Run it on your computer (VS Code)

1. Unzip the download and open the `freestyle-skill-tree` folder in VS Code.
2. You can double-click `index.html` to preview it. **For the installable version**, start a local server instead:
   - In VS Code, install the *Live Server* extension and click **Go Live**; or
   - Open a terminal in this folder and run `python -m http.server 8000`. Visit `http://localhost:8000/`.
3. Browse the skill map, click a trick and mark it as mastered. It saves automatically in your browser's `localStorage`.

## Put it on your phone (GitHub Pages: recommended)

1. Create a public repository on [GitHub](https://github.com/new), e.g. `freestyle-130`.
2. Upload the **contents** of this folder to the repository root. The main file must be named `index.html` at the root. GitHub's **Add file → Upload files** option works; include all seven required app resources (`index.html`, `style.css`, `data.js`, `app.js`, `manifest.webmanifest`, `sw.js`, and the `icons/` folder). `standalone.html` is optional.
3. In the repository, open **Settings → Pages**. Select **Deploy from a branch**, your main/default branch, and the **/(root)** folder. Save.
4. Once deployment finishes, open the Pages link shown in that screen. It will normally be in the form `https://YOUR-USERNAME.github.io/freestyle-130/`.
5. **iPhone:** open the link in Safari → Share → **Add to Home Screen** → Add. **Android:** open it in Chrome → ⋮ → **Add to Home screen** or **Install app** (the exact label can vary).
6. Open it once while online. The service worker then caches the core files so it can work offline after successful setup.

> You do **not** need an IDE on your phone. Keep the editor on your computer, then use the web app on your phone.

## No GitHub? Quick alternative

Send `standalone.html` to your phone, save it locally, and open it in a browser that permits local HTML files. It contains the whole tracker. Local HTML opening varies by iOS/Android browser and does not provide a proper installable app. GitHub Pages is the most reliable way to add it to your home screen.

## Saving and transferring progress

- Progress saves automatically in **this browser on this site** (localStorage).
- Progress does **not** sync between phone and computer, browsers, private mode, or local file and hosted URLs.
- To move progress: **My progress → Export progress** on the old device; transfer the `.json` file; then **My progress → Import progress** on the new device.
- Browser data clearing or uninstalling the home-screen app **may remove progress**. Keep JSON backups.
- Marking a skill as mastered is allowed even if the suggested prerequisites are unchecked, so you can track tricks you already know.

## Editing the trick list

Each line in `data.js` is `ID|Skill name|Difficulty 1–5|PrerequisiteID,PrerequisiteID`.

For example:

    L16|Touzani ATW (TATW)|3|L07,L01

The list includes named tricks and training challenges. Difficulty and prerequisites are a **suggested learning path**, not official or universal requirements. Trick naming varies between freestyle communities.

## Troubleshooting

- No home-screen install option? Open the hosted **HTTPS** GitHub Pages URL, not a `file://` file. iPhone: use Safari. Android: try Chrome.
- Old version after editing? Change `CACHE_VERSION` in `sw.js`, commit changes and reload once online; if necessary, clear that site's cached data. Export progress first.
- Progress missing on another device? Export/import it; there is no cloud sync.
- On an unsupported browser, localStorage may be unavailable. The app will say *Saving unavailable* instead of claiming it saved.

## New in v2: Progress over time

Open **Progress over time** in the side navigation, or **Journey** in the phone's bottom navigation.

- **Skills mastered over time:** interactive line graph with **30 days / 90 days / all** filters. Tap the graph to inspect a date.
- **Activity calendar:** past 35 days of mastery checkmarks (not a training-attendance log).
- **Milestones:** next mastery target; **recent milestones** show dated mastery/undo/reset changes.
- **Statistics:** currently mastered, marks made this week, active update days, and longest consecutive update-day streak.
- Undoing a skill or resetting progress lowers the chart's mastery total; earlier history stays visible.

### Updating your already-installed GitHub Pages app

1. **Optional but strongly recommended:** Open your current app and select **My progress → Export progress** to save a backup first.
2. Unzip **the new v2 download**. In your *existing* GitHub repository, replace the original `index.html`, `style.css`, `app.js`, `data.js`, `sw.js`, `manifest.webmanifest`, `README.md` and `icons/` files with the new ones. Upload the **contents** of the extracted folder into the repository root — do **not** create a second nested folder. Keep the same repository name and GitHub Pages URL.
3. GitHub Pages will publish the update. Reopen your installed app while online and reload. A second close/reopen or reload may be necessary while the offline cache replaces the original app.
4. You should now have a **Journey** tab on your phone, alongside Map, Skills, and Progress.

**Important:** Your original mastered skills are still read from the *same* `freestyle-130-progress-v1` localStorage key. This update doesn't erase them. The first time v2 loads, already-mastered skills become your **baseline starting today** because v1 did not record when those skills were originally mastered. From then on, each mark, undo, and reset is dated automatically. The graph is a record of **skill checkmarks**, not a measure of training time.

### Backups and moving your history to another device

Exported JSON files now have `version: 2` and include `history` as well as `completed`. Import v2 JSON on another device to restore both mastery and history. Old v1 JSON files still import completed skills, but their previous mastery dates were never recorded, so history starts on the import date. Changing your GitHub Pages URL creates a separate storage location; use Export/Import if you change it. Data does not sync online.
