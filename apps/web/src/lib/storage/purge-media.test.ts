import { describe, expect, it } from "vitest";

import { isCronAuthorized, purgeMedia } from "./purge-media";

function fakeAdmin({
  snaps = [] as string[],
  orphans = [] as { bucket_id: string; name: string }[],
  failRemove = false,
} = {}) {
  const removed: string[] = [];
  const rpcCalls: { name: string; args: unknown }[] = [];
  const admin = {
    rpc: async (name: string, args: unknown) => {
      rpcCalls.push({ name, args });
      if (name === "get_purgeable_snaps") return { data: snaps.map((media_path) => ({ media_path })), error: null };
      if (name === "get_orphaned_uploads") return { data: orphans, error: null };
      return { data: null, error: null };
    },
    storage: {
      from: (bucket: string) => ({
        remove: async (paths: string[]) => {
          if (failRemove) return { data: null, error: new Error("storage down") };
          removed.push(...paths.map((path) => `${bucket}:${path}`));
          return { data: [], error: null };
        },
      }),
    },
  };
  return { admin: admin as unknown as Parameters<typeof purgeMedia>[0], removed, rpcCalls };
}

describe("purgeMedia", () => {
  it("deletes purgeable snap files, then records them as purged", async () => {
    const { admin, removed, rpcCalls } = fakeAdmin({ snaps: ["u1/a.jpg", "u2/b.mp4"] });

    const result = await purgeMedia(admin);

    expect(removed).toEqual(["snaps:u1/a.jpg", "snaps:u2/b.mp4"]);
    expect(rpcCalls).toContainEqual({ name: "mark_snaps_purged", args: { p_paths: ["u1/a.jpg", "u2/b.mp4"] } });
    expect(result.snapsPurged).toBe(2);
  });

  it("deletes orphaned uploads from whichever bucket they are in", async () => {
    const { admin, removed } = fakeAdmin({
      orphans: [
        { bucket_id: "post-media", name: "u1/x.jpg" },
        { bucket_id: "chat-media", name: "u1/y.jpg" },
      ],
    });

    const result = await purgeMedia(admin);

    expect(removed.sort()).toEqual(["chat-media:u1/y.jpg", "post-media:u1/x.jpg"]);
    expect(result.orphansRemoved).toBe(2);
  });

  it("does not mark snaps purged when deleting their files failed", async () => {
    const { admin, rpcCalls } = fakeAdmin({ snaps: ["u1/a.jpg"], failRemove: true });

    await expect(purgeMedia(admin)).rejects.toThrow("storage down");
    expect(rpcCalls.map((call) => call.name)).not.toContain("mark_snaps_purged");
  });

  it("does nothing when there is nothing to delete", async () => {
    const { admin, removed, rpcCalls } = fakeAdmin();

    expect(await purgeMedia(admin)).toEqual({ snapsPurged: 0, orphansRemoved: 0 });
    expect(removed).toEqual([]);
    expect(rpcCalls.map((call) => call.name)).toEqual(["get_purgeable_snaps", "get_orphaned_uploads"]);
  });
});

describe("isCronAuthorized", () => {
  it("accepts exactly the configured secret", () => {
    expect(isCronAuthorized("Bearer s3cret-value", "s3cret-value")).toBe(true);
  });

  it.each([
    [null, "s3cret-value"],
    ["Bearer wrong-value", "s3cret-value"],
    ["Bearer s3cret-value-and-more", "s3cret-value"],
    ["s3cret-value", "s3cret-value"],
    ["Bearer ", ""],
    ["Bearer anything", undefined],
  ])("refuses %s when the secret is %s", (header, secret) => {
    expect(isCronAuthorized(header, secret)).toBe(false);
  });
});
