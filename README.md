# Interview Cue — V5 Cross-Device

This version is built specifically for:

- admin page on Computer A
- guest/index page on Computer B
- GitHub Pages hosting
- no Firebase setup

## URLs

Guest:
`https://YOUR-USERNAME.github.io/asp-interview-cue/`

Admin:
`https://YOUR-USERNAME.github.io/asp-interview-cue/admin.html`

## Cross-device realtime

This build uses MQTT over secure WebSockets.

The channel for this exact build is:

`asp/interview-cue/6c9efad2396759169ea6e78a5a5ca5ea/live`

Both HTML pages already use the same channel automatically.

You do NOT need to enter this room ID anywhere.

When both pages say:

`Cross-device live` / `Live`

they are connected.

## Test

1. Upload/push this entire folder to GitHub.
2. Wait for GitHub Pages to redeploy.
3. Open `/admin.html` on your computer.
4. Open `/` on a completely different computer or phone.
5. Wait until the status indicator says Live.
6. Add a question.
7. Add it to the queue or deploy it directly.
8. The other computer should update immediately.

## Questions and queue

Your full Question Bank and Queue are intentionally stored in the ADMIN browser's localStorage.

That means your private preparation stays on your admin computer.

Only the currently deployed question/timer is sent through the realtime channel.

## Timer presets

- 15 seconds
- 30 seconds
- 45 seconds
- 1 minute
- 1:30

## Auto Play

Turn on Auto Play and press Start Queue.

The admin page must remain open because it controls when the next queued question is deployed.

## Important security note

This version uses EMQX's free PUBLIC MQTT broker so it can work without accounts, Firebase, or a backend.

The room/channel name is long and randomly generated, which makes accidental collisions very unlikely, but this is not authenticated private messaging.

Do not use it for sensitive/confidential information.

For a production/private version, swap the public broker for a private MQTT service or Firebase/Supabase authentication.
