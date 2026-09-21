import { Header } from "@/components/Header";
import { DarkButton, FieldError, PrimaryCta } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLogin } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "@/lib/i18n";
import { Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Loader2, ShieldAlert } from "lucide-react";
import { type FormEvent, useState } from "react";

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const login = useLogin();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ phone?: string; password?: string }>(
    {},
  );
  const [showForgot, setShowForgot] = useState(false);

  const loginError = login.isError ? String(login.error?.message ?? "") : "";
  const isBlocked = loginError.includes("Compte bloque");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: { phone?: string; password?: string } = {};
    if (!phone.trim()) nextErrors.phone = t("auth.err.phoneRequired");
    else if (phone.replace(/\D/g, "").length < 6)
      nextErrors.phone = t("auth.err.phoneFormat");
    if (!password) nextErrors.password = t("auth.err.passwordRequired");
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    login.mutate(
      { phone: phone.trim(), password },
      {
        onSuccess: (session) => {
          signIn(session);
          void navigate({ to: "/" });
        },
      },
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Header title={t("app.name")} />

      <div className="relative h-44 overflow-hidden bg-hero-gradient">
        <div className="absolute inset-0 opacity-90" aria-hidden>
          <div className="absolute left-6 top-8 size-16 rounded-2xl bg-card/70 shadow-elevated" />
          <div className="absolute right-8 top-6 size-12 rounded-full bg-card/60 shadow-elevated" />
          <div className="absolute bottom-4 left-1/2 size-20 -translate-x-1/2 rounded-3xl bg-card/50 shadow-elevated" />
          <div className="absolute bottom-8 right-14 size-10 rounded-xl bg-primary/70 shadow-elevated" />
        </div>
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background to-transparent" />
      </div>

      <main className="mx-auto -mt-8 w-full max-w-md flex-1 px-4 pb-10">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-elevated">
          <div className="mb-6 text-center">
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
              {t("auth.loginTitle")}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("auth.loginSubtitle")}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="login-phone" className="sr-only">
                {t("auth.phone")}
              </Label>
              <Input
                id="login-phone"
                data-ocid="login.phone_input"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder={t("auth.phone")}
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                aria-invalid={Boolean(errors.phone)}
                className="h-12 rounded-full px-4"
              />
              <FieldError>{errors.phone}</FieldError>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="login-password" className="sr-only">
                {t("auth.password")}
              </Label>
              <div className="relative">
                <Input
                  id="login-password"
                  data-ocid="login.password_input"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder={t("auth.password")}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  aria-invalid={Boolean(errors.password)}
                  className="h-12 rounded-full px-4 pr-12"
                />
                <button
                  type="button"
                  data-ocid="login.password_toggle"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={
                    showPassword
                      ? t("auth.hidePassword")
                      : t("auth.showPassword")
                  }
                  className="absolute right-1 top-1 flex size-10 items-center justify-center rounded-full text-muted-foreground transition-smooth hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" aria-hidden />
                  ) : (
                    <Eye className="size-4" aria-hidden />
                  )}
                </button>
              </div>
              <FieldError>{errors.password}</FieldError>
            </div>

            {login.isError ? (
              isBlocked ? (
                <div
                  data-ocid="login.blocked_state"
                  className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
                >
                  <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                  <span>{t("account.blockedBody")}</span>
                </div>
              ) : (
                <p
                  data-ocid="login.error_state"
                  className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  {t("auth.err.invalidCredentials")}
                </p>
              )
            ) : null}

            <PrimaryCta
              type="submit"
              data-ocid="login.submit_button"
              disabled={login.isPending}
            >
              {login.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  {t("common.loading")}
                </>
              ) : (
                t("auth.loginButton")
              )}
            </PrimaryCta>

            <DarkButton
              type="button"
              data-ocid="login.register_button"
              onClick={() => void navigate({ to: "/register" })}
            >
              {t("auth.registerButton")}
            </DarkButton>
          </form>

          <div className="mt-5 text-center">
            <button
              type="button"
              data-ocid="login.forgot_button"
              onClick={() => setShowForgot((value) => !value)}
              className="text-sm font-medium text-destructive underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {t("auth.forgot")}
            </button>
            {showForgot ? (
              <p className="mt-2 text-xs text-muted-foreground">
                {t("auth.forgotHint")}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-6 text-center">
          <Button
            asChild
            variant="link"
            className="text-sm text-muted-foreground"
          >
            <Link to="/admin/login" data-ocid="login.admin_link">
              {t("auth.adminLink")}
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
