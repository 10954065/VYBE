import { Image } from 'expo-image';

// The VYBE logomark (same artwork as the app icon and splash; regenerate all
// of them together with scripts/generate-brand-assets.mjs).
export function BrandMark({ size = 72 }: { size?: number }) {
  return (
    <Image
      source={require('@/assets/images/brand-mark.png')}
      style={{ width: size, height: size }}
      accessibilityLabel="VYBE logo"
    />
  );
}
