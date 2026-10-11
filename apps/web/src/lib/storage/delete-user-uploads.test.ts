import { USER_UPLOAD_BUCKETS } from "@vybe/shared";
import { describe, expect, it } from "vitest";

import { deleteUserUploads } from "./delete-user-uploads";

const USER_ID = "36d8e13d-3ec0-461e-a4c6-b25e94e124fb";

/** An in-memory stand-in for the admin client's Storage API. */
function fakeAdmin(files: Record<string, string[]>, { failRemove = false } = {}) {
  const removed: string[] = [];
  const admin = {
    storage: {
      from: (bucket: string) => ({
        list: async (folder: string, { limit }: { limit: number }) => ({
          data: (files[bucket] ?? [])
            .filter((path) => path.startsWith(`${folder}/`) && !removed.includes(`${bucket}:${path}`))
            .slice(0, limit)
            .map((path) => ({ name: path.slice(folder.length + 1) })),
          error: null,
        }),
        remove: async (paths: string[]) => {
          if (failRemove) return { data: null, error: new Error("storage down") };
          removed.push(...paths.map((path) => `${bucket}:${path}`));
          return { data: [], error: null };
        },
      }),
    },
  };
  return { admin: admin as unknown as Parameters<typeof deleteUserUploads>[0], removed };
}

describe("deleteUserUploads", () => {
  it("removes every file in the user's folder of every upload bucket", async () => {
    const { admin, removed } = fakeAdmin({
      "post-media": [`${USER_ID}/a.jpg`, `${USER_ID}/b.jpg`, "someone-else/c.jpg"],
    });

    await deleteUserUploads(admin, USER_ID);

    expect(removed.sort()).toEqual([`post-media:${USER_ID}/a.jpg`, `post-media:${USER_ID}/b.jpg`]);
    expect(USER_UPLOAD_BUCKETS).toContain("post-media");
  });

  it("keeps going past a full page of files", async () => {
    const many = Array.from({ length: 2500 }, (_, n) => `${USER_ID}/photo${n}.jpg`);
    const { admin, removed } = fakeAdmin({ "post-media": many });

    await deleteUserUploads(admin, USER_ID);

    expect(removed).toHaveLength(2500);
  });

  it("fails loudly instead of reporting success when Storage refuses", async () => {
    const { admin } = fakeAdmin({ "post-media": [`${USER_ID}/a.jpg`] }, { failRemove: true });

    await expect(deleteUserUploads(admin, USER_ID)).rejects.toThrow("storage down");
  });
});
