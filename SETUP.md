# Connecting the site to your Google Drive (about 5 minutes)

1. Go to https://script.google.com and click **New project**. Name it `Aditi 40th backend`.
2. Delete the sample code and paste in everything from `apps-script/Code.gs`. Click **Save**.
3. In the function dropdown at the top choose **setup**, click **Run**, and allow the permissions.
   (Google will warn "app isn't verified": click Advanced, then "Go to Aditi 40th backend (unsafe)".
   It's your own script, running in your own account.)
   This creates a Drive folder `Aditi 40th - Uploads` and a Sheet `Aditi 40th - Contributions`.
4. Click **Deploy > New deployment**, the gear icon > **Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone**
   Click **Deploy** and copy the **Web app URL** (ends in `/exec`).
5. Paste that URL into `config.js` as `driveApi`.
