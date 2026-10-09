import { ThemedText } from '@/components/themed-text';

interface SocialProofLineProps {
  friendCount: number;
  /** The part after "has/have" or "is/are" — e.g. "been here", "going", "already in". */
  phrase: string;
}

/** "🙋 2 friends have been here" — renders nothing when there's no real signal to show. */
export function SocialProofLine({ friendCount, phrase }: SocialProofLineProps) {
  if (friendCount <= 0) return null;

  const isSingular = friendCount === 1;
  const auxiliary = phrase.startsWith('been') ? (isSingular ? 'has' : 'have') : isSingular ? 'is' : 'are';

  return (
    <ThemedText type="small" themeColor="tertiary">
      🙋 {friendCount} friend{isSingular ? '' : 's'} {auxiliary} {phrase}
    </ThemedText>
  );
}
