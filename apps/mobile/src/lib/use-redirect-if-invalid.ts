import { router } from 'expo-router';
import { useEffect } from 'react';

type Href = Parameters<typeof router.replace>[0];

// A detail screen's invalid-param guard (`z.object({ id: z.uuid() }).safeParse(...)`
// failing, e.g. from a malformed deep link) used to call router.replace()
// directly in the render body. That updates the navigator while the screen
// component is still rendering, which React warns about ("Cannot update a
// component while rendering a different component") — real, reproducible by
// just visiting a deep link with a bad id. Deferring to an effect fixes it.
export function useRedirectIfInvalid(isValid: boolean, to: Href) {
  useEffect(() => {
    if (!isValid) {
      router.replace(to);
    }
  }, [isValid, to]);
}
