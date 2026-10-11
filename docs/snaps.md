# Snaps and streaks (Phase 17)

The Snapchat side of VYBE: photos and short videos sent to friends that can be opened once, and streaks for keeping it up every day.

## Sending

- **From Home** (camera button): take a snap, then choose up to 15 friends. Friends you have a streak with come first, with their 🔥 count.
- **From a chat** (pink camera button in the composer): the snap goes straight to that person.

The camera (`features/snaps/snap-capture.tsx`, `expo-camera`):

- **Photo:** tap the shutter.
- **Video:** switch to VIDEO, tap to start, tap to stop. Recording stops itself at 10 seconds, with a countdown on screen.
- **Also:** front/back flip, flash, and a library button for a photo or a video of up to 10 seconds.

After capture, a full-screen preview shows "Send to Ama" or "Send to…".

On send (`use-send-snap`), the file is uploaded once to the private `snaps` bucket:

- **Photos** are resized to 1920px and re-encoded, which strips location data.
- **Videos** go as recorded.

Then `send_snap(recipients, …)` creates one message per recipient in one transaction: if any recipient can't be messaged, nobody gets it. Snaps follow the messaging rules (`docs/messages.md`): people who follow you, blocks always win.

## Opening once

A snap is a `messages` row of kind `snap`. The chat shows:

- **New snap:** a filled pink square (a photo) or violet square (a video), labelled "Tap to view".
- **Opened:** a hollow square, for the recipient. The sender sees "Delivered" until it's opened, then "Opened", live over Realtime.

Tapping opens the viewer (`/snap/[id]`):

- A photo stays for 10 seconds, with a countdown bar.
- A video plays once.
- A tap closes either one.

The once-only rule is enforced by the database, not the app:

- **Opening is required to read the file.** `open_snap` records `opened_at`, and the `snaps` bucket's read rule lets only the recipient read the file, and only for two minutes after opening, long enough to load a 10-second video. Before opening, nobody can read it; after the window, nobody can either. The sender never can.
- **It can't be undone.** Nothing lets anyone clear `opened_at` or reopen a snap after the window (`snap_already_opened`). Unopened snaps expire after 30 days.
- **Then the bytes go.** A cleanup job deletes the file once every recipient's window has passed (see below).
- **No side door through another bucket.** With snap files and chat photos both referenced from `messages`, a chat photo is only readable through a `photo` message. Otherwise a sender could upload the same file name to both buckets and send it as a snap, and the recipient could read the chat-photo copy indefinitely.

A determined recipient can still screenshot or screen-record a snap, as on Snapchat; the app doesn't detect screenshots.

## Streaks

A streak is a run of consecutive days on which both people sent each other at least one snap. Days are Accra days (UTC+0, no daylight saving).

- `handle_snap_streak` (a trigger on each snap) records each person's last snap day on the conversation. When both have snapped today and today isn't counted yet, the streak becomes yesterday's count + 1, or 1 if a day was missed.
- **Alive** means kept up today or yesterday. A streak from yesterday shows ⏳ ("ends tonight") until both snap again today. Anything older shows as gone.
- **Where it shows:**
  - The inbox: 🔥 count beside the name.
  - The chat: an orange "🔥 5-day snap streak" bar under the header, as in the Stitch Direct Chat design.
  - The snap friend picker.
- **The reminder:** at 18:00 Accra a pg_cron job reminds whoever hasn't snapped yet today about a streak that ends at midnight ("⏳ Your 5-day streak with Ama ends at midnight. Send a snap!"). It goes once a day per streak, behind the existing Streaks notification setting, and tapping it opens the chat.

## Cleanup

Deleting a file needs the Storage API, not SQL, so the job lives in the web app: `GET /api/cron/purge-media`. It needs `Authorization: Bearer $CRON_SECRET`, and with no secret configured it refuses everything. It deletes:

- **Snap files** every recipient opened more than 10 minutes ago, or that sat unopened for 30 days. They're recorded as purged.
- **Uploads never attached to anything** after a day, in any of the three buckets. These come from a post or message that failed after uploading, or from uploads made straight through the API. This closes the gap the Phase 15 security review left open.

`apps/web/vercel.json` schedules it daily (the Vercel Hobby limit). Until it runs, an opened snap is still unreadable; the job only frees the storage.

## Push

A snap pushes "📸 Sent you a snap" (or "🎥 … video snap"), one per burst like messages. Push delivery still waits on the EAS project id (`docs/notifications.md`).

## Verified

- **Database:** 35 pgTAP tests in `070_snaps_and_streaks`.
  - Sending, all or nothing.
  - Nobody else's upload can be sent as a snap.
  - Unreadable before opening; readable for the window, then not. A same-named chat-photo file stays unreadable.
  - The sender, outsiders and the cleanup functions are locked out.
  - Streaks start, don't double-count, survive a day, and break after a missed day.
  - One reminder, to the right person, with the other name capped. Video length is capped at 10 seconds.
  - A suspended person's snaps can't be opened. Display names refuse line breaks and anything over 60 characters.
- **Browser, demo account, with Ama through the API:**
  - Sent a photo snap from the chat: "Delivered".
  - Ama couldn't load it before opening, then could. The bubble turned "Opened" live.
  - Ama snapped back: a 1-day streak appeared in the chat and inbox.
  - Opened her snap: shown with a countdown, closed at 10 seconds, then "Opened".
  - Sent one snap from Home to two friends through the picker: two conversations, both "Delivered".
  - A video snap played once and closed itself when it ended.
- **Cleanup endpoint:** 401 without or with the wrong secret. With it, it deleted both opened snap files (zero left in the bucket), and a day-old unattached upload was removed while attached files were kept.
- **Not testable here:** the camera itself (the test browser has no camera, and browsers can't record video with `expo-camera`). Capture, recording and the 10-second stop need a phone.

## Security review

A review with live attempts against the local database confirmed the once-only rule holds, the cross-bucket side door is closed, nobody can forge a snap from someone else's upload or inflate a streak alone, and the cleanup functions and endpoint are locked down. It found two real issues, both fixed before release:

- **Phishing through display names (high).** The streak reminder put the other person's display name into the notification verbatim, so a name like "URGENT: your account is suspended, verify at …" arrived as a reminder. The follow, like and comment pushes from Phase 8 had the same flaw. Fixed at the source: `profiles_display_name_clean` now refuses control characters (line breaks) and names over 60 characters, matching what the app already allowed, and sign-up trims the starting name to fit. Every notification and push names people through one helper, `notification_name`, which also caps names at 40 characters.
- **Suspended users' snaps could still be opened (medium).** `open_snap` runs as definer and checked blocks but not suspensions. It now hides a suspended person's snaps like the rest of their conversations.

## Web-only behaviour

Browsers block a video with sound from starting on its own, so on web a video snap shows a play button first. Phones play it straight away.
