import { Layout } from "@/components/Layout";
import { AccountsPanel } from "@/components/admin/AccountsPanel";
import { ServiceInboxPanel } from "@/components/admin/ServiceInboxPanel";
import { TasksPanel } from "@/components/admin/TasksPanel";
import { VipPanel } from "@/components/admin/VipPanel";
import { WithdrawalsPanel } from "@/components/admin/WithdrawalsPanel";
import { PageContainer } from "@/components/ui-bits";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { LogOut } from "lucide-react";
import { useState } from "react";

type AdminTab = "accounts" | "withdrawals" | "vip" | "tasks" | "inbox";

const TABS: { id: AdminTab; labelKey: string }[] = [
  { id: "accounts", labelKey: "admin.tab.accounts" },
  { id: "withdrawals", labelKey: "admin.tab.withdrawals" },
  { id: "vip", labelKey: "admin.tab.vip" },
  { id: "tasks", labelKey: "admin.tab.tasks" },
  { id: "inbox", labelKey: "admin.tab.inbox" },
];

export function AdminPage() {
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const [tab, setTab] = useState<AdminTab>("accounts");

  return (
    <Layout
      title={t("admin.title")}
      showNav={false}
      headerRight={
        <button
          type="button"
          data-ocid="admin.logout_button"
          onClick={signOut}
          aria-label={t("common.logout")}
          className="flex size-10 items-center justify-center rounded-full transition-smooth hover:bg-secondary-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <LogOut className="size-5" aria-hidden />
        </button>
      }
    >
      <div className="sticky top-14 z-20 border-b border-border bg-card shadow-card">
        <div
          data-ocid="admin.tabs"
          className="no-scrollbar mx-auto flex w-full max-w-md gap-1 overflow-x-auto px-3 py-2"
        >
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              data-ocid={`admin.tab.${item.id}`}
              onClick={() => setTab(item.id)}
              aria-pressed={tab === item.id}
              className={cn(
                "shrink-0 rounded-full px-3.5 py-2 text-xs font-bold transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                tab === item.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              {t(item.labelKey as never)}
            </button>
          ))}
        </div>
      </div>

      <PageContainer data-ocid="admin.page">
        {tab === "accounts" ? <AccountsPanel /> : null}
        {tab === "withdrawals" ? <WithdrawalsPanel /> : null}
        {tab === "vip" ? <VipPanel /> : null}
        {tab === "tasks" ? <TasksPanel /> : null}
        {tab === "inbox" ? <ServiceInboxPanel /> : null}
      </PageContainer>
    </Layout>
  );
}
