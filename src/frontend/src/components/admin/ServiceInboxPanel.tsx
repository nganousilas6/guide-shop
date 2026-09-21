import type { Attachment } from "@/backend";
import { AttachmentKind as AttachmentKindEnum } from "@/backend";
import {
  AttachmentChip,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  ListSkeleton,
  SurfaceCard,
} from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  useClearConversation,
  useConversationMessages,
  useConversations,
  useReplyToUser,
} from "@/lib/api";
import { MAX_ATTACHMENT_BYTES, uploadAttachment } from "@/lib/attachments";
import { formatDateTime, formatFileSize } from "@/lib/format";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { MessageSquare, Paperclip, Send, Trash2 } from "lucide-react";
import { type ChangeEvent, useRef, useState } from "react";

type PendingAttachment = {
  attachment: Attachment;
  progress: number;
};

export function ServiceInboxPanel() {
  const { t } = useTranslation();
  const conversations = useConversations(true);
  const [selected, setSelected] = useState<bigint | null>(null);
  const messages = useConversationMessages(selected, selected !== null);
  const reply = useReplyToUser();
  const clearConversation = useClearConversation();
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState<PendingAttachment | null>(null);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [clearTarget, setClearTarget] = useState<bigint | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > MAX_ATTACHMENT_BYTES) {
      setAttachmentError(t("service.attachmentTooLarge"));
      return;
    }
    setAttachmentError(null);
    try {
      const attachment = await uploadAttachment(file, (percentage) => {
        setPending((current) =>
          current ? { ...current, progress: percentage } : current,
        );
      });
      setPending({ attachment, progress: 100 });
    } catch {
      setAttachmentError(t("service.attachmentFailed"));
    }
  };

  const send = () => {
    const body = draft.trim();
    if (selected === null) return;
    if (body === "" && !pending) return;
    const attachment = pending?.attachment ?? null;
    setDraft("");
    setPending(null);
    setAttachmentError(null);
    reply.mutate(
      { userId: selected, body, attachment },
      {
        onError: () => {
          setDraft((current) => (current === "" ? body : current));
          if (attachment) setPending({ attachment, progress: 100 });
          setAttachmentError(t("service.attachmentFailed"));
        },
      },
    );
  };

  if (conversations.isLoading) return <ListSkeleton rows={4} />;
  if (conversations.isError) {
    return (
      <ErrorState
        message={t("common.error")}
        retryLabel={t("common.retry")}
        onRetry={() => void conversations.refetch()}
      />
    );
  }

  const rows = conversations.data ?? [];

  if (rows.length === 0) {
    return (
      <div data-ocid="admin.inbox_panel">
        <EmptyState
          title={t("admin.inboxEmpty")}
          icon={<MessageSquare className="size-5" aria-hidden />}
        />
      </div>
    );
  }

  return (
    <div data-ocid="admin.inbox_panel" className="space-y-3">
      <ul data-ocid="admin.conversations_list" className="space-y-2">
        {rows.map((row, index) => {
          const isActive = selected === row.userId;
          return (
            <li key={row.userId.toString()}>
              <div
                className={cn(
                  "flex items-stretch gap-2 rounded-2xl border bg-card p-1.5 transition-smooth",
                  isActive
                    ? "border-primary shadow-card"
                    : "border-border hover:border-primary/40",
                )}
              >
                <button
                  type="button"
                  data-ocid={`admin.conversation_item.${index + 1}`}
                  onClick={() => {
                    setSelected(row.userId);
                    setDraft("");
                    setPending(null);
                    setAttachmentError(null);
                  }}
                  aria-pressed={isActive}
                  className="min-w-0 flex-1 rounded-xl p-2 text-left transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="min-w-0 truncate font-display text-sm font-bold text-foreground">
                      {row.phone}
                    </span>
                    {row.unreadCount > 0n ? (
                      <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-primary-foreground">
                        {t("admin.unread", {
                          count: row.unreadCount.toString(),
                        })}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {row.lastMessage}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {formatDateTime(row.lastMessageAt)}
                  </p>
                </button>
                <button
                  type="button"
                  data-ocid={`admin.clear_chat_button.${index + 1}`}
                  onClick={() => setClearTarget(row.userId)}
                  aria-label={t("admin.clearChat")}
                  className="flex w-10 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-smooth hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {selected === null ? (
        <EmptyState
          title={t("admin.selectConversation")}
          hint={t("admin.selectConversationHint")}
          icon={<MessageSquare className="size-5" aria-hidden />}
        />
      ) : (
        <SurfaceCard
          data-ocid="admin.conversation_thread"
          className="space-y-3"
        >
          {messages.isLoading ? (
            <ListSkeleton rows={2} />
          ) : messages.isError ? (
            <ErrorState
              message={t("common.error")}
              retryLabel={t("common.retry")}
              onRetry={() => void messages.refetch()}
            />
          ) : (
            <ul className="space-y-2">
              {[...(messages.data ?? [])].reverse().map((message) => (
                <li
                  key={message.id.toString()}
                  className={cn(
                    "flex",
                    message.fromAdmin ? "justify-end" : "justify-start",
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
                      message.fromAdmin
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground",
                    )}
                  >
                    {message.attachment ? (
                      <a
                        href={message.attachment.blob.getDirectURL()}
                        target="_blank"
                        rel="noreferrer"
                        download={message.attachment.name}
                        className="mb-1.5 block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <AttachmentChip
                          name={message.attachment.name}
                          kind={
                            message.attachment.kind === AttachmentKindEnum.image
                              ? "image"
                              : message.attachment.kind ===
                                  AttachmentKindEnum.video
                                ? "video"
                                : "file"
                          }
                          sizeLabel={formatFileSize(message.attachment.size)}
                          className="border-transparent bg-card/90"
                        />
                      </a>
                    ) : null}
                    {message.body ? (
                      <p className="whitespace-pre-wrap break-words">
                        {message.body}
                      </p>
                    ) : null}
                    <p
                      className={cn(
                        "mt-1 text-[10px]",
                        message.fromAdmin
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground",
                      )}
                    >
                      {formatDateTime(message.createdAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="space-y-2">
            {pending ? (
              <AttachmentChip
                name={pending.attachment.name}
                kind={
                  pending.attachment.kind === AttachmentKindEnum.image
                    ? "image"
                    : pending.attachment.kind === AttachmentKindEnum.video
                      ? "video"
                      : "file"
                }
                sizeLabel={formatFileSize(pending.attachment.size)}
                progress={pending.progress}
                onRemove={() => setPending(null)}
                removeLabel={t("service.removeAttachment")}
              />
            ) : null}

            <Textarea
              data-ocid="admin.reply_input"
              rows={3}
              placeholder={t("admin.replyPlaceholder")}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              className="resize-none rounded-xl"
            />

            <input
              ref={fileInputRef}
              type="file"
              data-ocid="admin.reply_attachment_input"
              className="hidden"
              onChange={(event) => void handleFileChange(event)}
            />

            {attachmentError ? (
              <p className="text-xs font-medium text-destructive">
                {attachmentError}
              </p>
            ) : null}

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                data-ocid="admin.reply_attach_button"
                onClick={() => fileInputRef.current?.click()}
                aria-label={t("service.attach")}
                className="size-11 shrink-0 rounded-full p-0"
              >
                <Paperclip className="size-4" aria-hidden />
              </Button>
              <Button
                type="button"
                data-ocid="admin.reply_button"
                onClick={send}
                disabled={
                  reply.isPending || (draft.trim() === "" && pending === null)
                }
                className="h-11 flex-1 rounded-full bg-primary font-bold text-primary-foreground hover:bg-primary/90"
              >
                <Send className="size-4" aria-hidden />
                {t("admin.reply")}
              </Button>
            </div>
          </div>
        </SurfaceCard>
      )}

      <ConfirmDialog
        open={clearTarget !== null}
        onOpenChange={(open) => {
          if (!open) setClearTarget(null);
        }}
        ocid="admin.clear_chat_dialog"
        title={t("admin.clearChatConfirmTitle")}
        description={t("admin.clearChatConfirmBody")}
        confirmLabel={t("admin.clearChat")}
        cancelLabel={t("common.cancel")}
        destructive
        pending={clearConversation.isPending}
        onConfirm={() => {
          if (clearTarget === null) return;
          clearConversation.mutate(clearTarget, {
            onSuccess: () => {
              if (selected === clearTarget) {
                setSelected(null);
                setDraft("");
                setPending(null);
              }
              setClearTarget(null);
            },
          });
        }}
      />
    </div>
  );
}
