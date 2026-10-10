import { useMutation } from "@tanstack/react-query";
import { signOut } from "@/lib/auth/sign-out";
import { supabase } from "@/lib/supabase/client";

/**
 * Account deletion needs the Auth Admin API (service role), which the
 * mobile app never holds — it calls apps/web's /api/account/delete with
 * its own access token instead. See that route for the server side.
 */
export function useDeleteAccount() {
  return useMutation({
    mutationFn: async () => {
      const { data } = await supabase.auth.getSession();
      const accessToken = data.session?.access_token;
      if (!accessToken) throw new Error("Not signed in.");

      const apiUrl = process.env.EXPO_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/api/account/delete`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) {
        throw new Error("Failed to delete account. Please try again.");
      }

      await signOut();
    },
  });
}
