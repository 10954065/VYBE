import { z } from "zod";

export const POST_KINDS = ["text", "image", "video", "poll"] as const;
export const postKindSchema = z.enum(POST_KINDS);
export type PostKind = z.infer<typeof postKindSchema>;

export const POST_VISIBILITIES = ["everyone", "followers", "friends", "crew", "only_me"] as const;
export const postVisibilitySchema = z.enum(POST_VISIBILITIES);
export type PostVisibility = z.infer<typeof postVisibilitySchema>;

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
});
export type FeedPost = z.infer<typeof feedPostSchema>;

export const createPostInputSchema = z.object({
  body: z.string().trim().min(1, "Say something.").max(2000),
  visibility: postVisibilitySchema.default("everyone"),
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
