import type { InfiniteData } from '@tanstack/react-query';
import type { Message } from '@vybe/shared';

/** A message as the chat shows it: `isPending` until the server has it. */
export type ChatMessage = Message & { isPending?: boolean };
export type MessagePages = InfiniteData<ChatMessage[], unknown>;

export function messagesQueryKey(conversationId: string | undefined) {
  return ['messages', conversationId] as const;
}

function newestFirst(a: ChatMessage, b: ChatMessage): number {
  return b.created_at.getTime() - a.created_at.getTime() || (b.id > a.id ? 1 : b.id < a.id ? -1 : 0);
}

/**
 * The cached pages with `message` in them: replacing the copy with the same
 * id (a pending message the server confirmed, or a Realtime echo of one
 * already shown), or adding it to the newest page. Pages stay newest first.
 * Without cached pages there's nothing to update: the first fetch will
 * include the message.
 */
export function withMessage(data: MessagePages | undefined, message: ChatMessage): MessagePages | undefined {
  if (!data) return data;

  const pageIndex = data.pages.findIndex((page) => page.some((item) => item.id === message.id));
  if (pageIndex === -1) {
    const [newest = [], ...older] = data.pages;
    return { ...data, pages: [[message, ...newest].sort(newestFirst), ...older] };
  }

  return {
    ...data,
    pages: data.pages.map((page, index) =>
      index === pageIndex ? page.map((item) => (item.id === message.id ? message : item)).sort(newestFirst) : page,
    ),
  };
}

/** The cached pages without the message `id` (a send that failed). */
export function withoutMessage(data: MessagePages | undefined, id: string): MessagePages | undefined {
  if (!data) return data;
  return { ...data, pages: data.pages.map((page) => page.filter((item) => item.id !== id)) };
}
