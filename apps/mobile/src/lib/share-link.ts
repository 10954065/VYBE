import * as Linking from 'expo-linking';

// Mirrors the five entities that already have an `(app)/<entity>/[id]` route
// (see apps/mobile/src/app/(app)): post, place, event, crew, profile.
export type ShareableEntity = 'post' | 'place' | 'event' | 'crew' | 'profile';

// Linking.createURL resolves per-platform: `vybe://<entity>/<id>` in a
// native build (scheme from app.json), `exp://host/--/<entity>/<id>` in Expo
// Go, and the actual `http://host:port/<entity>/<id>` web URL on web — which
// Expo Router can already resolve back to the matching screen in all three
// cases, since the path matches the file-based route exactly (group segments
// like `(app)` never appear in the URL).
export function buildShareLink(entity: ShareableEntity, id: string): string {
  return Linking.createURL(`${entity}/${id}`);
}
