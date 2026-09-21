import type { Attachment } from "@/backend";
import { AttachmentChip } from "@/components/ui-bits";
import {
  attachmentKindKey,
  formatFileSize,
  isImageFilename,
  isVideoFilename,
} from "@/lib/format";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Headset } from "lucide-react";

export function ChatBubble({
  body,
  fromAdmin,
  time,
  index,
  attachment,
}: {
  body: string;
  fromAdmin: boolean;
  time: string;
  index: number;
  attachment?: Attachment;
}) {
  const { t } = useTranslation();
  const isImage = attachment ? isImageFilename(attachment.name) : false;
  const isVideo = attachment ? isVideoFilename(attachment.name) : false;
  const kind = attachment
    ? isImage
      ? "image"
      : isVideo
        ? "video"
        : "file"
    : "file";

  return (
    <div
      data-ocid={`service.message.${index}`}
      className={cn(
        "flex w-full items-end gap-2",
        fromAdmin ? "justify-start" : "justify-end",
      )}
    >
      {fromAdmin ? (
        <span
          aria-hidden
          className="mb-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-service text-service-foreground shadow-xs"
        >
          <Headset className="size-4" />
        </span>
      ) : null}

      <div
        className={cn(
          "flex max-w-[78%] flex-col gap-1",
          fromAdmin ? "items-start" : "items-end",
        )}
      >
        <div
          className={cn(
            "flex flex-col gap-2 rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-xs",
            fromAdmin
              ? "rounded-bl-sm bg-muted text-foreground"
              : "rounded-br-sm bg-service text-service-foreground",
          )}
        >
          {attachment ? (
            isImage ? (
              <a
                data-ocid={`service.message.${index}.attachment`}
                href={attachment.blob.getDirectURL()}
                target="_blank"
                rel="noreferrer"
                className="block overflow-hidden rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <img
                  src={attachment.blob.getDirectURL()}
                  alt={attachment.name}
                  loading="lazy"
                  className="max-h-56 w-full max-w-[15rem] object-cover"
                />
              </a>
            ) : isVideo ? (
              // biome-ignore lint/a11y/useMediaCaption: user-uploaded chat video has no caption track available
              <video
                data-ocid={`service.message.${index}.attachment`}
                src={attachment.blob.getDirectURL()}
                controls
                preload="metadata"
                className="max-h-56 w-full max-w-[15rem] rounded-xl bg-black/40"
              />
            ) : (
              <a
                data-ocid={`service.message.${index}.attachment`}
                href={attachment.blob.getDirectURL()}
                target="_blank"
                rel="noreferrer"
                download={attachment.name}
                className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <AttachmentChip
                  name={attachment.name}
                  kind={kind}
                  sizeLabel={`${t(attachmentKindKey(attachment.kind))} · ${formatFileSize(
                    attachment.size,
                  )}`}
                  className="border-transparent bg-card/90"
                />
              </a>
            )
          ) : null}

          {body ? (
            <span className="whitespace-pre-wrap break-words">{body}</span>
          ) : null}
        </div>
        <time className="px-1 text-[10px] font-medium text-muted-foreground">
          {time}
        </time>
      </div>
    </div>
  );
}
