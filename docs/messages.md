# Direct messages (Phase 16)

Private one-to-one chat: text and photos, delivered live, with read receipts and an unread badge. The Stitch export has a Direct Chat screen (`direct_chat_akosua_frank`) that `docs/design-system.md` had flagged as having no backend; this is that backend plus a first version of the screen. Group chat (Stitch's Squad Group Chat) is not built.

## Who can message whom

- **You can message anyone who follows you.** Following someone is them choosing to hear from you, so a stranger can't open a chat with you until you follow them.
- **Once someone has messaged you, you can reply**, whether or not you follow each other.
- **Blocks always win.** A block either way hides the conversation and its photos from both people, and nobody can send across it. Unblocking brings the history back.
- **Suspended users** can't send, and their conversations disappear for the other person, like the rest of their content.

All of this is enforced in the database (`can_message`), not the app. The app only uses it to decide whether to show the Message button (`can_message_user`) and who to list under New message (`get_message_contacts`: everyone who follows you, friends first).

## Data model

`supabase/migrations/20261016000000_direct_messages.sql`:

- **`conversations`**: one row per pair of people, stored as `user_a < user_b` with a unique constraint, so there can only ever be one conversation between two people. Each side's read position (`user_a_read_at`, `user_b_read_at`) lives on the row.
- **`messages`**: `text` (a body) or `photo` (a `chat-media` storage path, with an optional caption), at most 2000 characters, never edited.

Clients never write `conversations` directly. `start_direct_conversation` creates one only when you're allowed to message the other person, and `mark_conversation_read` moves only the caller's own read position. Messages are inserted directly, through RLS that checks the sender is you, you're in the conversation, `can_message` allows it, and any photo is one you uploaded. The app picks each new message's id, so the message shows instantly and the copy Realtime sends back is recognised rather than shown twice.

**Limits:** 30 messages a minute and 20 chat-photo uploads per 5 minutes per person.

## Photos

Same approach as photo posts (`docs/feed.md`): resized and re-encoded on the phone (which strips location data), uploaded to the private `chat-media` bucket under `<user id>/`, and read through short-lived signed URLs. Storage only signs a chat photo for the two people in that conversation, through the same RLS chain (`storage.objects` → `messages` → `conversations`), so a block hides photos too. Deleting an account deletes its chat photos (`USER_UPLOAD_BUCKETS`).

## Live delivery

`messages` and `conversations` are in the `supabase_realtime` publication. The app holds one Realtime subscription per signed-in user (`useMessagesRealtime`, mounted in the app layout) with no filter: Realtime only delivers a row to subscribers whose RLS lets them read it, so each person hears exactly their own conversations.

- A new message goes straight into the open chat's cache.
- A conversation update (someone read it) updates "Seen".
- Either one refreshes the inbox and the unread badge on Home.

## Notifications

A new message sends a push to the other person ("Ama Kyei: Pulling up in 20!", or "📷 Photo"), unless they turned off **Direct messages** in notification settings. A burst of messages (several within 30 seconds) sends one push, not one each, and the sender's name in the push title is stripped of line breaks and capped at 40 characters. No in-app notification row is written: unread chats have their own badge. Push still depends on the EAS project id (`docs/notifications.md`), so it isn't delivered to phones yet. Tapping a push doesn't open the chat yet either; the push carries the chat's URL for when that's wired up.

## Screens

- **Home**: a paper-plane button next to the bell, with the number of unread conversations.
- **Messages** (`/messages`): conversations newest first, with your last message prefixed "You:", unread counts in bold, and a New message button.
- **New message** (`/messages/new`): people who follow you, searchable.
- **Chat** (`/messages/[id]`):
  - Bubbles: yours violet on the right, theirs dark on the left with their avatar.
  - Grouping: messages within five minutes share one timestamp, and each day starts with a "TODAY • 8:15 PM" divider.
  - Your newest message shows "Sending…", "Sent" or "Seen".
  - Photos come from the + button, with an optional caption. Older messages load as you scroll up.
- **Profile**: a Message button when you can message the person or already have a chat.

The comment bar from Phase 14 became a shared `ComposerBar` (pill, growing input, round send button, rides the keyboard) used by both comments and chat.

## Verified

- **Database:** 36 pgTAP tests in `060_direct_messages`.
  - Who can start, send and reply.
  - Forged senders, backdated messages and edits are refused.
  - Outsiders can't read, post or open photos.
  - Read receipts move only your own position.
  - Blocks hide the conversation and its photos, and stop sending.
  - Suspended users can't send, and their profile no longer offers Message.
  - A burst of messages queues one push, with a cleaned-up title. The upload limit holds.
- **Browser, demo account, with Ama as a second account through the API:**
  - Started a chat from New message, sent text (instant, then "Sent").
  - Ama read it: "Seen" appeared without a reload. Her reply arrived live.
  - Sent a photo with a caption.
  - Home's badge went to 1 when she sent two more, and the inbox showed "2" in bold.
  - The profile's Message button reopened the same chat.
- **Storage API:** Ama can open the chat photo; Kofi (not in the chat) can't open it, read the messages, or post into the conversation.

## Security review

A review of this phase, with live attempts as an outsider against the local database, found no way to read or post into someone else's conversation, but three real issues, all fixed before release:

- **A suspended person's profile still offered Message** and reopened the (hidden) conversation. Sending already failed, but the chat looked reachable and confirmed it existed. `can_message_user` and `start_direct_conversation` run as definer, so they now repeat the suspension rule the conversation's RLS applies.
- **Push spam:** anyone allowed to message you could send up to 30 pushes a minute (the message rate limit). Now one push per burst.
- **Push title spoofing:** the sender's display name became the push title verbatim, so a name with a line break in it ("VYBE Security", then "Alert: verify your account") could pose as a system alert. Now cleaned and capped.

## Not done yet

- Opening a chat from a push notification.
- Typing indicators, deleting messages, message reactions.
- Group chats.
