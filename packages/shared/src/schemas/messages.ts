import { z } from "zod";

/** Mirrors messages.body's length check. */
export const MESSAGE_MAX_LENGTH = 2000;

export const MESSAGE_KINDS = ["text", "photo"] as const;
export const messageKindSchema = z.enum(MESSAGE_KINDS);
export type MessageKind = z.infer<typeof messageKindSchema>;

// A row of `messages`, as get_messages and Realtime deliver it.
export const messageSchema = z.object({
  id: z.uuid(),
  conversation_id: z.uuid(),
  sender_id: z.uuid(),
  kind: messageKindSchema,
  body: z.string().nullable(),
  media_path: z.string().nullable(),
  media_width: z.number().int().positive().nullable(),
  media_height: z.number().int().positive().nullable(),
  // z.coerce.date(), not z.iso.datetime(): see profiles.ts for why.
  created_at: z.coerce.date(),
});
export type Message = z.infer<typeof messageSchema>;

// A row of `conversations`: always two people, stored in a fixed order,
// each with their own read position.
export const conversationSchema = z.object({
  id: z.uuid(),
  user_a: z.uuid(),
  user_b: z.uuid(),
  created_at: z.coerce.date(),
  last_message_at: z.coerce.date().nullable(),
  user_a_read_at: z.coerce.date().nullable(),
  user_b_read_at: z.coerce.date().nullable(),
});
export type Conversation = z.infer<typeof conversationSchema>;

// A row of the get_inbox RPC.
export const inboxEntrySchema = z.object({
  conversation_id: z.uuid(),
  partner_id: z.uuid(),
  partner_username: z.string(),
  partner_display_name: z.string().nullable(),
  partner_avatar_url: z.url().nullable(),
  last_message_at: z.coerce.date(),
  last_message_sender_id: z.uuid().nullable(),
  last_message_kind: messageKindSchema.nullable(),
  last_message_body: z.string().nullable(),
  unread_count: z.coerce.number().int().nonnegative(),
  partner_read_at: z.coerce.date().nullable(),
});
export type InboxEntry = z.infer<typeof inboxEntrySchema>;

// A row of the get_message_contacts RPC.
export const messageContactSchema = z.object({
  id: z.uuid(),
  username: z.string(),
  display_name: z.string().nullable(),
  avatar_url: z.url().nullable(),
  is_friend: z.boolean(),
});
export type MessageContact = z.infer<typeof messageContactSchema>;

export const sendMessageInputSchema = z
  .object({
    conversation_id: z.uuid(),
    body: z.string().trim().max(MESSAGE_MAX_LENGTH).optional(),
    photo: z
      .object({
        path: z.string().min(1),
        width: z.number().int().positive(),
        height: z.number().int().positive(),
      })
      .optional(),
  })
  // Mirrors messages_content: a text message needs words, a photo doesn't.
  .refine((value) => !!value.body || !!value.photo, {
    message: "Write a message or add a photo.",
    path: ["body"],
  });
export type SendMessageInput = z.infer<typeof sendMessageInputSchema>;
