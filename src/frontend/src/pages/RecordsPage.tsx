import { RecordStatus } from "@/backend";
import type { TaskRecordView } from "@/backend";
import { Layout } from "@/components/Layout";
import { RecordCard } from "@/components/RecordCard";
import { RecordDetail } from "@/components/RecordDetail";
import {
  EmptyState,
  ErrorState,
  ListSkeleton,
  PageContainer,
} from "@/components/ui-bits";
import { useRecords } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { type TranslationKey, useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { ClipboardList } from "lucide-react";
import { useState } from "react";

type Tab = {
  id: string;
  labelKey: TranslationKey;
  status: RecordStatus | null;
};

const TABS: Tab[] = [
  { id: "all", labelKey: "records.tab.all", status: null },
  {
    id: "soumission",
    labelKey: "records.tab.submitted",
    status: RecordStatus.soumission,
  },
  {
    id: "termine",
    labelKey: "records.tab.completed",
    status: RecordStatus.termine,
  },
  { id: "frozen", labelKey: "records.tab.frozen", status: RecordStatus.frozen },
];

export function RecordsPage() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [selected, setSelected] = useState<TaskRecordView | null>(null);

  const currentTab = TABS.find((tab) => tab.id === activeTab) ?? TABS[0];
  const recordsQuery = useRecords(currentTab.status, isAuthenticated);
  const records = recordsQuery.data ?? [];

  return (
    <Layout title={t("records.title")}>
      <PageContainer>
        <div
          role="tablist"
          aria-label={t("records.title")}
          data-ocid="records.filter.tab"
          className="sticky top-0 z-10 -mx-4 mb-4 flex items-stretch gap-1 border-b border-border bg-background/95 px-4 backdrop-blur"
        >
          {TABS.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                data-ocid={`records.filter.tab.${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative flex-1 whitespace-nowrap px-2 py-3 text-sm font-semibold transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t(tab.labelKey)}
                <span
                  aria-hidden
                  className={cn(
                    "absolute inset-x-2 bottom-0 h-0.5 rounded-full transition-smooth",
                    isActive ? "bg-secondary" : "bg-transparent",
                  )}
                />
              </button>
            );
          })}
        </div>

        {recordsQuery.isLoading ? (
          <ListSkeleton rows={4} />
        ) : recordsQuery.isError ? (
          <ErrorState
            message={t("common.error")}
            retryLabel={t("common.retry")}
            onRetry={() => void recordsQuery.refetch()}
          />
        ) : records.length === 0 ? (
          <EmptyState
            title={t("records.empty")}
            hint={t("records.emptyHint")}
            icon={<ClipboardList className="size-5" aria-hidden />}
          />
        ) : (
          <ul data-ocid="records.list" className="space-y-3">
            {records.map((record, index) => (
              <li key={record.id.toString()}>
                <RecordCard
                  record={record}
                  index={index}
                  onOpen={setSelected}
                />
              </li>
            ))}
          </ul>
        )}
      </PageContainer>

      {selected ? (
        <RecordDetail record={selected} onClose={() => setSelected(null)} />
      ) : null}
    </Layout>
  );
}
