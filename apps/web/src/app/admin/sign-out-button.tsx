import { signOut } from "./auth-actions";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <button type="submit" className="text-sm text-neutral-400 underline-offset-4 hover:text-neutral-100 hover:underline">
        Sign out
      </button>
    </form>
  );
}
