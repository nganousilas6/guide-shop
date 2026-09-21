import { AttachmentKind } from "@/backend";
import type { Attachment } from "@/backend";
import { ExternalBlob } from "@caffeineai/object-storage";

/** Maximum size for a chat attachment, in bytes (25 MB). */
export const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024;

/** Detect the backend attachment kind from the browser file's MIME type. */
export function attachmentKindFor(file: File): AttachmentKind {
  if (file.type.startsWith("image/")) return AttachmentKind.image;
  if (file.type.startsWith("video/")) return AttachmentKind.video;
  return AttachmentKind.file;
}

/**
 * Upload a browser `File` through platform object storage and return the
 * backend `Attachment` reference. `onProgress` receives 0–100.
 *
 * The MIME type and original filename are passed into `fromBytes` so the
 * gateway stores `Content-Type` and `Content-Disposition`; the backend record
 * keeps the filename for lists and UI.
 */
export async function uploadAttachment(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<Attachment> {
  if (file.size > MAX_ATTACHMENT_BYTES) {
    throw new Error("attachment-too-large");
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  let blob = ExternalBlob.fromBytes(bytes, file.type, file.name);
  if (onProgress) {
    blob = blob.withUploadProgress(onProgress);
  }
  return {
    blob,
    kind: attachmentKindFor(file),
    name: file.name,
    size: BigInt(file.size),
  };
}
