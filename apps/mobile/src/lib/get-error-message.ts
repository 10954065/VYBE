// Server errors that should read as an explanation, not a code. The database
// raises these by name (see the rate-limit triggers in
// supabase/migrations/20261014000000_security_hardening.sql).
const FRIENDLY_MESSAGES: { match: string; message: string }[] = [
  { match: "rate_limited", message: "You're doing that a lot — take a breather and try again in a minute." },
];

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const friendly = FRIENDLY_MESSAGES.find(({ match }) => error.message.includes(match));
    return friendly?.message ?? error.message;
  }
  return "Something went wrong. Please try again.";
}
