import { z } from "zod";

export const POST_KINDS = ["text", "image", "video", "poll"] as const;
export const postKindSchema = z.enum(POST_KINDS);
export type PostKind = z.infer<typeof postKindSchema>;

export const POST_VISIBILITIES = ["everyone", "followers", "friends", "crew", "only_me"] as const;
export const postVisibilitySchema = z.enum(POST_VISIBILITIES);
export type PostVisibility = z.infer<typeof postVisibilitySchema>;

/** Private Storage bucket for post photos (supabase/migrations/20261015000000_photo_posts.sql). */
export const POST_MEDIA_BUCKET = "post-media";
/**
 * Every bucket that stores files under `<user id>/`, so deleting an account
 * can remove them. Add each new user-upload bucket here.
 */
export const USER_UPLOAD_BUCKETS = [POST_MEDIA_BUCKET] as const;
/** Mirrors post_media's `position between 0 and 3` check. */
export const POST_MAX_PHOTOS = 4;

// One photo as the feed RPCs return it (`post_media_json`): a storage path,
// not a URL — the bucket is private, so the app signs a short-lived URL.
export const postMediaSchema = z.object({
  path: z.string().min(1),
  type: z.enum(["image", "video"]),
  width: z.number().int().positive().nullable(),
  height: z.number().int().positive().nullable(),
});
export type PostMedia = z.infer<typeof postMediaSchema>;

// A photo already uploaded to POST_MEDIA_BUCKET, ready to attach to a post.
export const uploadedPhotoSchema = z.object({
  path: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});
export type UploadedPhoto = z.infer<typeof uploadedPhotoSchema>;

// Shape returned by the `get_home_feed` RPC (supabase/migrations/20261007090000_feed.sql),
// which flattens the author join and reaction/comment counts server-side.
export const feedPostSchema = z.object({
  id: z.uuid(),
  author_id: z.uuid(),
  author_username: z.string(),
  author_display_name: z.string().nullable(),
  author_avatar_url: z.url().nullable(),
  city_id: z.uuid().nullable(),
  crew_id: z.uuid().nullable(),
  kind: postKindSchema,
  body: z.string().nullable(),
  poll_options: z.unknown().nullable(),
  visibility: postVisibilitySchema,
  // z.coerce.date(), not z.iso.datetime(): see profiles.ts for why.
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  reaction_count: z.coerce.number().int().nonnegative(),
  comment_count: z.coerce.number().int().nonnegative(),
  viewer_has_reacted: z.boolean(),
  media: z.array(postMediaSchema).default([]),
});
export type FeedPost = z.infer<typeof feedPostSchema>;

export const createPostInputSchema = z
  .object({
    body: z.string().trim().max(2000).optional(),
    visibility: postVisibilitySchema.default("everyone"),
    crew_id: z.uuid().optional(),
    photos: z.array(uploadedPhotoSchema).max(POST_MAX_PHOTOS, `Up to ${POST_MAX_PHOTOS} photos.`).default([]),
  })
  // Mirrors create_post's `empty_post` check.
  .refine((value) => !!value.body || value.photos.length > 0, {
    message: "Say something or add a photo.",
    path: ["body"],
  })
  // Mirrors posts' own `crew_visibility_requires_crew` check constraint —
  // fail fast client-side instead of round-tripping to hit it.
  .refine((value) => value.visibility !== "crew" || !!value.crew_id, {
    message: "A crew post needs a crew_id.",
    path: ["crew_id"],
  });
export type CreatePostInput = z.infer<typeof createPostInputSchema>;

export const commentSchema = z.object({
  id: z.uuid(),
  post_id: z.uuid(),
  author_id: z.uuid(),
  author_username: z.string(),
  author_display_name: z.string().nullable(),
  author_avatar_url: z.url().nullable(),
  parent_comment_id: z.uuid().nullable(),
  body: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});
export type Comment = z.infer<typeof commentSchema>;

export const createCommentInputSchema = z.object({
  post_id: z.uuid(),
  body: z.string().trim().min(1, "Write a comment.").max(1000),
  parent_comment_id: z.uuid().optional(),
});
export type CreateCommentInput = z.infer<typeof createCommentInputSchema>;
