// Private Storage buckets. Every one keeps a user's files under `<user id>/`.

/** Photos attached to posts (supabase/migrations/20261015000000_photo_posts.sql). */
export const POST_MEDIA_BUCKET = "post-media";
/** Photos sent in chats (supabase/migrations/20261016000000_direct_messages.sql). */
export const CHAT_MEDIA_BUCKET = "chat-media";

/** Every bucket deleting an account must empty. Add each new user-upload bucket here. */
export const USER_UPLOAD_BUCKETS = [POST_MEDIA_BUCKET, CHAT_MEDIA_BUCKET] as const;
