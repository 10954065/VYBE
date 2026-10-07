const UNITS = [
  { label: 'y', seconds: 31536000 },
  { label: 'mo', seconds: 2592000 },
  { label: 'w', seconds: 604800 },
  { label: 'd', seconds: 86400 },
  { label: 'h', seconds: 3600 },
  { label: 'm', seconds: 60 },
] as const;

export function formatRelativeTime(date: Date, now: Date = new Date()): string {
  const seconds = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));
  if (seconds < 60) return 'just now';

  for (const unit of UNITS) {
    const value = Math.floor(seconds / unit.seconds);
    if (value >= 1) return `${value}${unit.label}`;
  }
  return 'just now';
}
