# Interview Cue — FIXED Cross-Device Build

This is the corrected GitHub Pages build.

## What was fixed

- `index.html` is correctly named.
- `styles.css` is correctly named.
- MQTT.js now loads from a valid CDN version:
  `https://cdnjs.cloudflare.com/ajax/libs/mqtt/5.14.0/mqtt.min.js`
- Both pages use the same existing `channel-config.js`.
- Better connection errors are shown on-screen.

## GitHub URLs

Guest:
`https://j0sephanders0n.github.io/asp-interview-cue/`

Admin:
`https://j0sephanders0n.github.io/asp-interview-cue/admin.html`

## What you should see

Admin top-right:
`Cross-device live`

Guest top-left:
`Live`

Only press Deploy once BOTH say they are connected.

## Replace your current project

Delete the CONTENTS of:

`C:\Repos\AmericanSchoolOfParis\Pod`

but KEEP the hidden `.git` folder if it exists.

Then copy all files from this ZIP into that folder.

The root should contain exactly these important files:

- index.html
- admin.html
- styles.css
- admin.js
- guest.js
- channel-config.js

Then run:

```powershell
cd "C:\Repos\AmericanSchoolOfParis\Pod"
git add -A
git commit -m "Fix cross-device realtime connection"
git push
```

Wait about 1 minute for GitHub Pages to rebuild.

## Quick test

Open the guest URL on a phone using cellular data and the admin URL on your computer.

If both say Live, add a question and press its upward-arrow Deploy button.

The guest screen should change immediately.

## If it still says Connecting

Open Chrome DevTools > Console.

The page now distinguishes between:

- `MQTT library failed to load`
- `Channel config missing`
- `Connection error`

That will tell us exactly which network step is being blocked.

## Realtime transport

This uses the EMQX public MQTT broker over secure WebSockets:

`wss://broker.emqx.io:8084/mqtt`

Only the currently deployed cue is transmitted. The question bank and queue remain in localStorage on the admin browser.
