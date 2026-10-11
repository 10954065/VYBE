import type { Message } from '@vybe/shared';
import { describe, expect, it } from 'vitest';

import { withMessage, withoutMessage, type MessagePages } from './message-cache';

const CONVERSATION = '9f0b8a8e-3c3a-4c1e-9a55-0d6f6b0e5a01';
const SENDER = '36d8e13d-3ec0-461e-a4c6-b25e94e124fb';

function message(id: string, at: string, body = id): Message {
  return {
    id,
    conversation_id: CONVERSATION,
    sender_id: SENDER,
    kind: 'text',
    body,
    media_path: null,
    media_width: null,
    media_height: null,
    created_at: new Date(at),
  };
}

const ids = (data: MessagePages | undefined) => data?.pages.map((page) => page.map((item) => item.id));

const cached: MessagePages = {
  pages: [
    [message('b0000000-0000-4000-8000-000000000002', '2026-10-11T20:02:00Z'), message('b0000000-0000-4000-8000-000000000001', '2026-10-11T20:01:00Z')],
    [message('a0000000-0000-4000-8000-000000000001', '2026-10-10T20:00:00Z')],
  ],
  pageParams: [null, { createdAt: '2026-10-11T20:01:00Z' }],
};

describe('withMessage', () => {
  it('adds a new message to the newest page, newest first', () => {
    const next = withMessage(cached, message('c0000000-0000-4000-8000-000000000003', '2026-10-11T20:03:00Z'));
    expect(ids(next)?.[0]).toEqual([
      'c0000000-0000-4000-8000-000000000003',
      'b0000000-0000-4000-8000-000000000002',
      'b0000000-0000-4000-8000-000000000001',
    ]);
    expect(ids(next)?.[1]).toEqual(['a0000000-0000-4000-8000-000000000001']);
  });

  it('replaces a pending message with the confirmed one instead of showing it twice', () => {
    const pending = { ...message('c0000000-0000-4000-8000-000000000003', '2026-10-11T20:03:05Z'), isPending: true };
    const withPending = withMessage(cached, pending);
    const confirmed = withMessage(withPending, message('c0000000-0000-4000-8000-000000000003', '2026-10-11T20:03:00Z'));

    expect(confirmed?.pages[0].filter((item) => item.id === pending.id)).toHaveLength(1);
    expect(confirmed?.pages[0][0].isPending).toBeUndefined();
  });

  it('ignores a Realtime echo of a message already shown', () => {
    const echo = message('b0000000-0000-4000-8000-000000000002', '2026-10-11T20:02:00Z');
    expect(ids(withMessage(cached, echo))).toEqual(ids(cached));
  });

  it('leaves an unopened conversation alone', () => {
    expect(withMessage(undefined, message('c0000000-0000-4000-8000-000000000003', '2026-10-11T20:03:00Z'))).toBeUndefined();
  });

  it('does not change the cache it was given', () => {
    const before = JSON.stringify(cached);
    withMessage(cached, message('c0000000-0000-4000-8000-000000000003', '2026-10-11T20:03:00Z'));
    expect(JSON.stringify(cached)).toBe(before);
  });
});

describe('withoutMessage', () => {
  it('removes a failed send from whichever page it is on', () => {
    const next = withoutMessage(cached, 'b0000000-0000-4000-8000-000000000001');
    expect(ids(next)).toEqual([['b0000000-0000-4000-8000-000000000002'], ['a0000000-0000-4000-8000-000000000001']]);
  });
});
