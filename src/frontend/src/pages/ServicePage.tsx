import type { Attachment, ChatMessageView } from "@/backend";
import { ChatBubble } from "@/components/ChatBubble";
import { Layout } from "@/components/Layout";
import {
  AttachmentChip,
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/ui-bits";
import {
  useBackendActor,
  useMyMessages,
  useSendMessage,
  useServiceStatus,
} from "@/lib/api";
import { uploadAttachment } from "@/lib/attachments";
import { useAuth } from "@/lib/auth";
import {
  formatDateTime,
  formatFileSize,
  formatHour,
  isServiceOpen,
  serviceStatusKey,
} from "@/lib/format";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useNavigate } from "@tanstack/react-router";
import { Headset, Loader2, Paperclip, SendHorizontal } from "lucide-react";
import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";

const MAX_LENGTH = 5000;
const PAGE_SIZE = 50n;

type PendingAttachment = {
  file: File;
  kind: "image" | "video" | "file";
  progress: number;
};

export function ServicePage() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const messagesQuery = useMyMessages(isAuthenticated);
  const serviceStatusQuery = useServiceStatus(isAuthenticated);
  const sendMessage = useSendMessage();
  const { actor } = useBackendActor();

  const [draft, setDraft] = useState("");
  const [olderMessages, setOlderMessages] = useState<ChatMessageView[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState(false);

  const [pending, setPending] = useState<PendingAttachment | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const didInitialScroll = useRef(false);

  const status = serviceStatusQuery.data ?? null;
  const isOpen = isServiceOpen(status);
  const reopensAt = status ? formatHour(status.opensAtHour) : null;

  // The backend returns messages newest-first (descending id). Reverse each
  // page to oldest-first and prepend older pages so the final render order is
  // oldest-to-newest, with the newest message at the bottom.
  const messages = [...(messagesQuery.data ?? [])].reverse();
  const allMessages = [...olderMessages, ...messages];
  const isTooLong = draft.length > MAX_LENGTH;
  const hasContent = draft.trim().length > 0 || pending !== null;
  const canSend = isOpen && hasContent && !isTooLong && !isUploading;

  // Only offer "load more" when the first page was full, i.e. older messages exist.
  useEffect(() => {
    if (messagesQuery.isSuccess) {
      setHasMore(messages.length >= Number(PAGE_SIZE));
    }
  }, [messagesQuery.isSuccess, messages.length]);

  useEffect(() => {
    if (didInitialScroll.current || messages.length === 0) return;
    didInitialScroll.current = true;
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  useEffect(() => {
    if (messages.length === 0) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  const handleLoadMore = async () => {
    const oldest = allMessages[0];
    if (!oldest || isLoadingMore || !actor) return;
    setIsLoadingMore(true);
    setLoadMoreError(false);
    try {
      const page = await actor.listMyMessages(PAGE_SIZE, oldest.id);
      if (page.length === 0) {
        setHasMore(false);
      } else {
        // Page arrives newest-first; reverse to oldest-first before prepending.
        const olderPage = [...page].reverse();
        setOlderMessages((current) => [...olderPage, ...current]);
        if (page.length < Number(PAGE_SIZE)) setHasMore(false);
      }
    } catch {
      setLoadMoreError(true);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handlePickFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Allow re-picking the same file after a removal.
    event.target.value = "";
    if (!file) return;
    setAttachmentError(null);
    setPending({
      file,
      kind: file.type.startsWith("image/")
        ? "image"
        : file.type.startsWith("video/")
          ? "video"
          : "file",
      progress: 0,
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const body = draft.trim();
    if (!isOpen || isTooLong || (!body && !pending)) return;

    const attachmentFile = pending?.file ?? null;
    setDraft("");
    setPending(null);
    setAttachmentError(null);

    let attachment: Attachment | null = null;
    if (attachmentFile) {
      setIsUploading(true);
      try {
        attachment = await uploadAttachment(attachmentFile, (percent) => {
          setPending((current) =>
            current ? { ...current, progress: percent } : current,
          );
        });
      } catch (error) {
        setIsUploading(false);
        setAttachmentError(
          error instanceof Error && error.message === "attachment-too-large"
            ? t("service.attachmentTooLarge")
            : t("service.attachmentFailed"),
        );
        setDraft((current) => (current === "" ? body : current));
        setPending({
          file: attachmentFile,
          kind: attachmentFile.type.startsWith("image/")
            ? "image"
            : attachmentFile.type.startsWith("video/")
              ? "video"
              : "file",
          progress: 0,
        });
        return;
      }
      setIsUploading(false);
    }

    sendMessage.mutate(
      { body, attachment },
      {
        onError: () => {
          setDraft((current) => (current === "" ? body : current));
        },
      },
    );
  };

  return (
    <Layout
      title={t("service.title")}
      onBack={() => void navigate({ to: "/" })}
    >
      <div className="mx-auto flex w-full max-w-md flex-col px-4 pt-4">
        <div
          data-ocid="service.status_banner"
          className={cn(
            "flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-center text-xs font-semibold",
            isOpen
              ? "bg-success/10 text-success"
              : "bg-destructive/10 text-destructive",
          )}
        >
          <span
            aria-hidden
            className={cn(
              "size-2 rounded-full",
              isOpen ? "bg-success" : "bg-destructive",
            )}
          />
          {t(serviceStatusKey(status))}
        </div>

        <p
          data-ocid="service.hours_note"
          className="mt-2 rounded-xl bg-service/10 px-3 py-2 text-center text-xs font-medium text-service"
        >
          {isOpen || !reopensAt ? t("service.hours") : t("service.closedHint")}
        </p>

        <div
          ref={scrollRef}
          data-ocid="service.message_list"
          className="mt-3 flex max-h-[58vh] min-h-[45vh] flex-col gap-3 overflow-y-auto rounded-2xl border border-border bg-card p-3"
        >
          {messagesQuery.isLoading ? (
            <LoadingState label={t("common.loading")} />
          ) : messagesQuery.isError ? (
            <ErrorState
              message={t("common.error")}
              retryLabel={t("common.retry")}
              onRetry={() => void messagesQuery.refetch()}
            />
          ) : allMessages.length === 0 ? (
            <EmptyState
              title={t("service.empty")}
              hint={t("service.emptyHint")}
              icon={<Headset className="size-5" aria-hidden />}
            />
          ) : (
            <>
              {hasMore ? (
                <button
                  type="button"
                  data-ocid="service.load_more_button"
                  onClick={() => void handleLoadMore()}
                  disabled={isLoadingMore}
                  className="mx-auto rounded-full border border-border bg-muted px-3.5 py-1.5 text-xs font-semibold text-muted-foreground transition-smooth hover:bg-muted/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60"
                >
                  {isLoadingMore ? t("common.loading") : t("service.loadMore")}
                </button>
              ) : null}

              {loadMoreError ? (
                <p className="text-center text-xs font-medium text-destructive">
                  {t("common.error")}
                </p>
              ) : null}

              {allMessages.map((message, index) => (
                <ChatBubble
                  key={message.id.toString()}
                  index={index + 1}
                  body={message.body}
                  fromAdmin={message.fromAdmin}
                  time={formatDateTime(message.createdAt)}
                  attachment={message.attachment}
                />
              ))}
            </>
          )}
          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={(event) => void handleSubmit(event)}
          className="sticky bottom-20 mt-3 rounded-2xl border border-border bg-card p-2 shadow-card"
        >
          {pending ? (
            <div className="mb-2">
              <AttachmentChip
                name={pending.file.name}
                kind={pending.kind}
                sizeLabel={formatFileSize(BigInt(pending.file.size))}
                progress={isUploading ? pending.progress : undefined}
                onRemove={
                  isUploading
                    ? undefined
                    : () => {
                        setPending(null);
                        setAttachmentError(null);
                      }
                }
                removeLabel={t("service.removeAttachment")}
              />
            </div>
          ) : null}

          {attachmentError ? (
            <p
              data-ocid="service.attachment_error"
              className="mb-2 px-1 text-xs font-medium text-destructive"
            >
              {attachmentError}
            </p>
          ) : null}

          <div className="flex items-end gap-2">
            <input
              ref={fileInputRef}
              id="service-attachment"
              data-ocid="service.upload_button"
              type="file"
              accept="image/*,video/*"
              className="sr-only"
              onChange={handlePickFile}
            />
            <button
              type="button"
              data-ocid="service.attach_button"
              onClick={() => fileInputRef.current?.click()}
              disabled={!isOpen || isUploading}
              aria-label={t("service.attach")}
              className={cn(
                "flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground transition-smooth hover:bg-muted/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                (!isOpen || isUploading) && "cursor-not-allowed opacity-50",
              )}
            >
              <Paperclip className="size-5" aria-hidden />
            </button>

            <label htmlFor="service-message" className="sr-only">
              {t("service.placeholder")}
            </label>
            <textarea
              id="service-message"
              data-ocid="service.message_input"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={
                isOpen ? t("service.placeholder") : t("service.closedHint")
              }
              rows={1}
              maxLength={MAX_LENGTH + 1}
              disabled={!isOpen}
              className="max-h-28 min-h-11 flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-smooth placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
            />
            <button
              type="submit"
              data-ocid="service.send_button"
              disabled={!canSend || sendMessage.isPending}
              aria-label={t("service.send")}
              className={cn(
                "flex size-11 shrink-0 items-center justify-center rounded-full bg-service text-service-foreground shadow-cta transition-smooth hover:bg-service/90 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                (!canSend || sendMessage.isPending) &&
                  "cursor-not-allowed opacity-50",
              )}
            >
              {isUploading || sendMessage.isPending ? (
                <Loader2 className="size-5 animate-spin" aria-hidden />
              ) : (
                <SendHorizontal className="size-5" aria-hidden />
              )}
            </button>
          </div>

          <div className="mt-1 flex items-center justify-between px-1">
            <span
              data-ocid="service.send_error"
              className="text-xs font-medium text-destructive"
            >
              {sendMessage.isError ? t("common.error") : ""}
            </span>
            <span
              data-ocid="service.char_counter"
              className={cn(
                "text-[11px] font-semibold tabular-nums",
                isTooLong ? "text-destructive" : "text-muted-foreground",
              )}
            >
              {t("service.counter", { count: draft.length })}
            </span>
          </div>
          {isTooLong ? (
            <p className="px-1 text-xs font-medium text-destructive">
              {t("service.tooLong")}
            </p>
          ) : null}
        </form>
      </div>
    </Layout>
  );
}
