import { ComposerBar } from '@/components/composer-bar';

// Matches createCommentInputSchema's body limit in @vybe/shared.
const MAX_COMMENT_LENGTH = 1000;

interface CommentComposerProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  isSending: boolean;
  errorMessage?: string;
}

/** The comment bar pinned under a post. */
export function CommentComposer(props: CommentComposerProps) {
  return (
    <ComposerBar
      {...props}
      placeholder="Add a comment…"
      inputLabel="Comment"
      sendLabel="Send comment"
      maxLength={MAX_COMMENT_LENGTH}
    />
  );
}
