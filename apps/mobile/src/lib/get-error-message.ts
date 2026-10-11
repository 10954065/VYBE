// Server errors that should read as an explanation, not a code. The database
// raises these by name (see the rate-limit triggers in
// supabase/migrations/20261014000000_security_hardening.sql).
const FRIENDLY_MESSAGES: { match: string; message: string }[] = [
  { match: "rate_limited", message: "You're doing that a lot — take a breather and try again in a minute." },
  // The Storage API doesn't pass the database's message through: an upload
  // refused by check_upload_rate (the only P0001 an upload can hit) arrives
  // as this generic text.
  { match: "database error, code: P0001", message: "You're uploading a lot — wait a few minutes and try again." },
  { match: "cannot_message", message: "You can message people once they follow you." },
  { match: "profiles_display_name_clean", message: "Your name can be up to 60 characters, on one line." },
];

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const friendly = FRIENDLY_MESSAGES.find(({ match }) => error.message.includes(match));
    return friendly?.message ?? error.message;
  }
  return "Something went wrong. Please try again.";
}
