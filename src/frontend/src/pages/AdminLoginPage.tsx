import { Header } from "@/components/Header";
import { FieldError, PrimaryCta } from "@/components/ui-bits";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminLogin } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "@/lib/i18n";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, ShieldCheck } from "lucide-react";
import { type FormEvent, useState } from "react";

export function AdminLoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const adminLogin = useAdminLogin();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{
    username?: string;
    password?: string;
  }>({});

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: { username?: string; password?: string } = {};
    if (!username.trim()) nextErrors.username = t("auth.err.usernameRequired");
    if (!password) nextErrors.password = t("auth.err.passwordRequired");
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    adminLogin.mutate(
      { username: username.trim(), password },
      {
        onSuccess: (session) => {
          signIn(session);
          void navigate({ to: "/admin" });
        },
      },
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Header
        title={t("auth.adminTitle")}
        onBack={() => void navigate({ to: "/login" })}
      />

      <main className="mx-auto w-full max-w-md flex-1 px-4 py-8">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground shadow-elevated">
            <ShieldCheck className="size-7" aria-hidden />
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
              {t("auth.adminTitle")}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("auth.adminSubtitle")}
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-card"
          noValidate
        >
          <div className="space-y-1.5">
            <Label htmlFor="admin-username" className="text-sm font-medium">
              {t("auth.adminUsername")}
            </Label>
            <Input
              id="admin-username"
              data-ocid="admin_login.username_input"
              type="text"
              autoComplete="username"
              placeholder={t("auth.adminUsername")}
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              aria-invalid={Boolean(errors.username)}
              className="h-12 rounded-full px-4"
            />
            <FieldError>{errors.username}</FieldError>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="admin-password" className="text-sm font-medium">
              {t("auth.password")}
            </Label>
            <Input
              id="admin-password"
              data-ocid="admin_login.password_input"
              type="password"
              autoComplete="current-password"
              placeholder={t("auth.password")}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={Boolean(errors.password)}
              className="h-12 rounded-full px-4"
            />
            <FieldError>{errors.password}</FieldError>
          </div>

          {adminLogin.isError ? (
            <p
              data-ocid="admin_login.error_state"
              className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {t("auth.err.adminInvalid")}
            </p>
          ) : null}

          <PrimaryCta
            type="submit"
            data-ocid="admin_login.submit_button"
            disabled={adminLogin.isPending}
          >
            {adminLogin.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                {t("common.loading")}
              </>
            ) : (
              t("auth.adminButton")
            )}
          </PrimaryCta>
        </form>

        <p className="mt-5 text-center">
          <button
            type="button"
            data-ocid="admin_login.back_link"
            onClick={() => void navigate({ to: "/login" })}
            className="text-sm font-medium text-muted-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {t("auth.backToUser")}
          </button>
        </p>
      </main>
    </div>
  );
}
