# Update your existing Freestyle 130 phone app to v3

**Keep your existing GitHub repository name and GitHub Pages URL.** Updating the files at that same URL preserves your mastery and historical checkmarks in browser storage.

1. **Back up first:** Open your current app → **My progress (More)** → **Export progress**. Keep the downloaded JSON somewhere safe. You can import v1 or v2 backups into v3 if needed.
2. Unzip `freestyle-130-v3-training-update.zip`. Open the `freestyle-skill-tree` folder inside it.
3. Go to your **existing** GitHub repository → **Code → Add file → Upload files**. Upload the files and `icons/` folder **inside** `freestyle-skill-tree` to your repository's root, replacing old files. In particular include `training.js` and `v3.css`; they are new in this release. `index.html` must remain at the repository root.
4. Commit the upload. Wait for **Actions → pages build and deployment** to finish.
5. Open your existing GitHub Pages URL on your phone, while connected to the internet. Reload once or twice (or close and reopen the home-screen app) to replace the old offline cache.
6. Open **Train** in the bottom navigation. Tap **Daily quests**, **Timed challenges**, or **Video comparisons** from inside that screen. The **Journey** page now includes a chart of practice minutes.
7. Export another JSON backup after logging practice in v3.

## Data safety and privacy

- **Mastered skills:** v1 storage key `freestyle-130-progress-v1` is reused. The update does not erase your marked skills.
- **Mastery timeline:** v2 storage key `freestyle-130-history-v1` is reused. Existing dates and events are preserved.
- **Practice logs, challenge scores and personal-best attempts:** new v3 storage key `freestyle-130-training-v3` is added. v3 JSON export includes these and both old progress stores.
- **Video clips:** stored locally in the browser's IndexedDB, separately from the JSON backup. **Video files are NOT included in exported JSON**. Keep copies in your camera roll or elsewhere. Clearing website data, uninstalling the app, or changing the web address can erase local video clips.
- **Timer draft:** saved locally while you practise. If the app is interrupted, it reopens paused rather than counting time while you're away. Save the finished session to keep it in your history.
- **No cloud account or sync:** data is stored in that specific browser/home-screen app. To transfer JSON records, use Export → Import; transfer actual video files separately.
- **Daily quests:** generated from the current skill unlocks. A quest completes from logged minutes, a recorded best attempt, or a completed timed challenge. Quests are not pre-completed for days before v3.
- **Weekly goal:** a qualifying session is a recorded session lasting at least 5 minutes, starting Monday local time. You can set a goal of 1–7 sessions weekly.
- **Practice timer:** save when you're finished. Short challenge attempts under six seconds do not count toward logged practice time.

## Troubleshooting

**I still see the old site:** Confirm you uploaded to your *original* repo root, not a second folder. Confirm Pages deployed successfully. Force a refresh while online and reopen the home-screen app; v3 uses a new offline-cache version.

**Progress doesn't appear:** You're likely at a different URL or have a separate app storage container. Use your JSON export in **More → Import progress**. Importing a v1/v2 JSON backup restores those records; v3 practice records already on the device are left alone when importing an older backup.

**Videos won't save:** Videos rely on browser IndexedDB and device space. Keep files under 75 MB each; trim or compress longer clips. Browser privacy settings and storage pressure may delete local data. Your original camera-roll copy is the safe archive.

**No need to buy a domain or set up Node.js.** The app is static and deploys directly on GitHub Pages.
