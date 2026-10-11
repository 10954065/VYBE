import { describe, expect, it } from "vitest";

import { createPostInputSchema, POST_MAX_PHOTOS } from "./posts";

const photo = (n: number) => ({ path: `user/photo-${n}.jpg`, width: 1600, height: 1200 });

describe("createPostInputSchema", () => {
  it("accepts a caption alone", () => {
    const parsed = createPostInputSchema.parse({ body: "  Outside tonight  ", visibility: "everyone" });
    expect(parsed.body).toBe("Outside tonight");
    expect(parsed.photos).toEqual([]);
  });

  it("accepts photos without a caption", () => {
    expect(createPostInputSchema.safeParse({ photos: [photo(1)] }).success).toBe(true);
  });

  it("rejects a post with neither a caption nor a photo", () => {
    expect(createPostInputSchema.safeParse({ body: "   " }).success).toBe(false);
    expect(createPostInputSchema.safeParse({}).success).toBe(false);
  });

  it(`allows at most ${POST_MAX_PHOTOS} photos`, () => {
    const photos = Array.from({ length: POST_MAX_PHOTOS + 1 }, (_, n) => photo(n));
    expect(createPostInputSchema.safeParse({ photos: photos.slice(0, POST_MAX_PHOTOS) }).success).toBe(true);
    expect(createPostInputSchema.safeParse({ photos }).success).toBe(false);
  });

  it("requires a crew for a crew-only post", () => {
    expect(createPostInputSchema.safeParse({ body: "hi", visibility: "crew" }).success).toBe(false);
  });
});
