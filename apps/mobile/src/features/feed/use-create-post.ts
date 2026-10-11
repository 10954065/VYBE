import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createPostInputSchema,
  POST_MAX_PHOTOS,
  POST_MEDIA_BUCKET,
  type PostVisibility,
  type UploadedPhoto,
} from "@vybe/shared";

import { track } from "@/lib/analytics/analytics";
import { useSession } from "@/lib/auth/session-provider";
import { preparePhoto, type LocalPhoto } from "@/lib/media/photo";
import { randomFileName, removeFiles, uploadFile } from "@/lib/media/storage";
import { supabase } from "@/lib/supabase/client";

export interface CreatePostRequest {
  body?: string;
  visibility: PostVisibility;
  crew_id?: string;
  /** Photos straight from the picker or camera; resized and uploaded here. */
  photos?: LocalPhoto[];
}

async function uploadPhoto(userId: string, photo: LocalPhoto): Promise<UploadedPhoto> {
  const prepared = await preparePhoto(photo);
  const path = `${userId}/${randomFileName("jpg")}`;
  await uploadFile(POST_MEDIA_BUCKET, path, prepared.uri, "image/jpeg");
  return { path, width: prepared.width, height: prepared.height };
}

export function useCreatePost() {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const userId = session?.user.id;

  return useMutation({
    mutationFn: async ({ photos = [], ...request }: CreatePostRequest) => {
      if (!userId) throw new Error("Not signed in.");
      if (photos.length > POST_MAX_PHOTOS) throw new Error(`Up to ${POST_MAX_PHOTOS} photos.`);
      if (!request.body?.trim() && photos.length === 0) throw new Error("Say something or add a photo.");

      const uploads = await Promise.allSettled(photos.map((photo) => uploadPhoto(userId, photo)));
      const uploaded = uploads.flatMap((result) => (result.status === "fulfilled" ? [result.value] : []));

      try {
        const failed = uploads.find((result) => result.status === "rejected");
        if (failed) throw failed.reason;

        const parsed = createPostInputSchema.parse({ ...request, photos: uploaded });
        const { error } = await supabase.rpc("create_post", {
          p_body: parsed.body || undefined,
          p_visibility: parsed.visibility,
          p_crew_id: parsed.crew_id,
          p_media: parsed.photos,
        });
        if (error) throw error;
        track("post_created", {
          visibility: parsed.visibility,
          in_crew: !!parsed.crew_id,
          photo_count: parsed.photos.length,
        });
      } catch (error) {
        // Don't leave orphaned uploads behind. Best effort: the error worth
        // showing is the one that stopped the post, not a cleanup failure.
        await removeFiles(POST_MEDIA_BUCKET, uploaded.map((photo) => photo.path)).catch(() => undefined);
        throw error;
      }
    },
    onSuccess: (_data, request) => {
      queryClient.invalidateQueries({ queryKey: ["home-feed", userId] });
      if (request.crew_id) {
        queryClient.invalidateQueries({ queryKey: ["crew-posts", request.crew_id] });
      }
    },
  });
}
