# Interview Cue — FINAL Firebase Build

This version uses Firebase Realtime Database for cross-device control.

## Already configured

Firebase project:
`asp-interview-cue`

Realtime Database:
`https://asp-interview-cue-default-rtdb.firebaseio.com/`

You do not need MQTT and you do not need npm.

## GitHub URLs

Guest:
`https://j0sephanders0n.github.io/asp-interview-cue/`

Admin:
`https://j0sephanders0n.github.io/asp-interview-cue/admin.html`

## Expected status

Admin:
`Firebase live`

Guest:
`Live`

Once both statuses appear, Deploy on the admin page updates the guest page on any other internet-connected computer.

## IMPORTANT: database rules

In Firebase:

Databases & Storage > Realtime Database > Rules

Use:

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

Then click Publish.

This is intentionally open because this project has no admin authentication.

## Replace your GitHub project

Copy every file from this ZIP into:

`C:\Repos\AmericanSchoolOfParis\Pod`

Keep the hidden `.git` folder.

Then:

```powershell
cd "C:\Repos\AmericanSchoolOfParis\Pod"
git add -A
git commit -m "Switch realtime controls to Firebase"
git push
```

Wait about one minute for GitHub Pages to redeploy.

## Test

1. Open admin.html on Computer A.
2. Open index page on Computer B.
3. Confirm admin says Firebase live.
4. Confirm guest says Live.
5. Add a question.
6. Press its deploy arrow.
7. Guest screen should update immediately.
