# MongoDB → Google Drive Backups

This sets up automatic backups of your MongoDB Atlas data (residents, households,
sitios, certificates, everything) to a **"Barangay Backups"** folder in your own
Google Drive. It's meant to fill the gap that the free Atlas tier leaves — no
built-in backups — for a small system like this (3 users, a few thousand records).

## 1. Install the new dependencies

```
npm install
```

This pulls in `googleapis` (talks to Google Drive) and `archiver` (zips the backup),
which were added to `package.json`.

## 2. Create Google API credentials (one-time, ~5 minutes)

1. Go to [console.cloud.google.com](https://console.cloud.google.com/) and sign in
   with the Google account you want backups saved to.
2. Create a new project (top-left project dropdown → "New Project"). Any name is fine,
   e.g. "Barangay Backups".
3. In the search bar, search **"Google Drive API"** and click **Enable**.
4. Go to **APIs & Services → OAuth consent screen**.
   - User type: **External** (unless you have a Google Workspace account, then Internal is fine).
   - Fill in the required fields (app name, your email) and save through the steps.
   - On the "Test users" step, add your own Google account's email.
5. Go to **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
   - Application type: **Desktop app**.
   - Give it any name, click Create.
   - Click **Download JSON** on the credential you just created.
6. Rename the downloaded file to `credentials.json` and place it in the project
   root (same folder as `package.json`). This file is already in `.gitignore` —
   it will never be committed.

## 3. Run the backup once to authorize

```
npm run backup
```

The first time, it prints a URL in the terminal. Open it, sign in with the same
Google account, click through the "unverified app" warning (this is normal for
your own personal script — click **Advanced → Go to [app name] (unsafe)**), and
approve access. Google gives you a code — paste it back into the terminal.

This creates `token.json` (also gitignored) so every run after this is fully
automatic — no browser needed again, unless you revoke access or the token expires.

After that first run, you should see a new **"Barangay Backups"** folder in your
Google Drive with a `barangay-backup-<date>.zip` file inside it.

## 4. What each backup contains

The zip has one JSON file per MongoDB collection (residents, households, sitios,
occupations, certificatetemplates, generatedcertificates, barangayofficials, users).
It's plain JSON, so if you ever need to look at what a backup contains, you can just
unzip it and open the files — no special tools required.

By default the script keeps the **last 8 backups** (both locally in a `backups/`
folder and in Google Drive) and deletes older ones automatically, so it doesn't
grow forever. Change this by setting `BACKUP_RETENTION_COUNT` in `.env.local`.

## 5. Automate it (run weekly without thinking about it)

The script itself doesn't schedule anything — you run it, or your Mac runs it for
you on a schedule via `launchd` (the modern replacement for cron on macOS).

1. Find the full paths you need:
   ```
   which node
   which npx
   ```
2. Open `com.barangay.backup.plist` (included alongside this file) and fill in:
   - `REPLACE_WITH_NPX_PATH` → the output of `which npx`
   - `REPLACE_WITH_PROJECT_PATH` → the full path to this project folder
     (e.g. `/Users/hisd3dev3/Projects/Personal Work/barangay-info-system`)
3. Copy it into your LaunchAgents folder and load it:
   ```
   cp com.barangay.backup.plist ~/Library/LaunchAgents/
   launchctl load ~/Library/LaunchAgents/com.barangay.backup.plist
   ```

This runs the backup every **Monday at 2:00 AM** (your Mac needs to be on/awake
at that time — if it's asleep, macOS runs it the next time it wakes up). To change
the schedule, edit the `Hour`/`Minute`/`Weekday` numbers in the plist.

To stop it later:
```
launchctl unload ~/Library/LaunchAgents/com.barangay.backup.plist
```

Logs from each scheduled run are written to `backup.log` and `backup-error.log`
in the project folder, so you can check whether it's actually been running.

## 6. Restoring from a backup (if you ever need it)

There's no restore script yet since it's hopefully never needed, but restoring is
straightforward: unzip the backup, then for each `<collection>.json` file, import
it into the matching MongoDB collection with `mongoimport` (from the free MongoDB
Database Tools) or a short script using the same Mongoose models. Let me know if
you want a restore script built alongside this — it's a quick follow-up.
