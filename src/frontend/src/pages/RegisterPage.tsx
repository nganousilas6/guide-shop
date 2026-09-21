import { Header } from "@/components/Header";
import { FieldError, PrimaryCta } from "@/components/ui-bits";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRegister } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "@/lib/i18n";
import { useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { type FormEvent, useState } from "react";

/** Minimum length enforced by the backend for every platform password. */
const MIN_PASSWORD_LENGTH = 8;

type FieldErrors = {
  phone?: string;
  password?: string;
  promoCode?: string;
  secondaryPassword?: string;
};

export function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const register = useRegister();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [secondaryPassword, setSecondaryPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: FieldErrors = {};
    if (!phone.trim()) nextErrors.phone = t("auth.err.phoneRequired");
    else if (phone.replace(/\D/g, "").length < 6)
      nextErrors.phone = t("auth.err.phoneFormat");
    if (!password) nextErrors.password = t("auth.err.passwordRequired");
    else if (password.length < MIN_PASSWORD_LENGTH)
      nextErrors.password = t("auth.err.passwordLength");
    if (!promoCode.trim()) nextErrors.promoCode = t("auth.err.promoRequired");
    if (!secondaryPassword)
      nextErrors.secondaryPassword = t("auth.err.secondaryRequired");
    else if (secondaryPassword.length < MIN_PASSWORD_LENGTH)
      nextErrors.secondaryPassword = t("auth.err.secondaryLength");
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    register.mutate(
      {
        phone: phone.trim(),
        password,
        promoCode: promoCode.trim(),
        secondaryPassword,
      },
      {
        onSuccess: (account) => {
          signIn({ account, isAdmin: false });
          void navigate({ to: "/" });
        },
      },
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Header
        title={t("app.name")}
        onBack={() => void navigate({ to: "/login" })}
      />

      <main className="mx-auto w-full max-w-md flex-1 px-4 py-6">
        <div className="mb-6 text-center">
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
            {t("auth.registerTitle")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("auth.registerSubtitle")}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-card"
          noValidate
        >
          <div className="space-y-1.5">
            <Label htmlFor="register-phone" className="text-sm font-medium">
              {t("auth.phone")}
            </Label>
            <Input
              id="register-phone"
              data-ocid="register.phone_input"
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
            <Label htmlFor="register-password" className="text-sm font-medium">
              {t("auth.password")}
            </Label>
            <div className="relative">
              <Input
                id="register-password"
                data-ocid="register.password_input"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder={t("auth.password")}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-invalid={Boolean(errors.password)}
                aria-describedby="register-password-hint"
                className="h-12 rounded-full px-4 pr-12"
              />
              <button
                type="button"
                data-ocid="register.password_toggle"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={
                  showPassword ? t("auth.hidePassword") : t("auth.showPassword")
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
            <p
              id="register-password-hint"
              className="text-xs text-muted-foreground"
            >
              {t("auth.passwordMinHint")}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="register-promo" className="text-sm font-medium">
              {t("auth.promoCode")}
            </Label>
            <Input
              id="register-promo"
              data-ocid="register.promo_input"
              type="text"
              autoComplete="off"
              placeholder={t("auth.promoCode")}
              value={promoCode}
              onChange={(event) =>
                setPromoCode(event.target.value.toUpperCase())
              }
              aria-invalid={Boolean(errors.promoCode)}
              className="h-12 rounded-full px-4 uppercase tracking-wide"
            />
            <FieldError>{errors.promoCode}</FieldError>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="register-secondary" className="text-sm font-medium">
              {t("auth.secondaryPassword")}
            </Label>
            <Input
              id="register-secondary"
              data-ocid="register.secondary_input"
              type="password"
              autoComplete="new-password"
              placeholder={t("auth.secondaryPassword")}
              value={secondaryPassword}
              onChange={(event) => setSecondaryPassword(event.target.value)}
              aria-invalid={Boolean(errors.secondaryPassword)}
              aria-describedby="register-secondary-hint"
              className="h-12 rounded-full px-4"
            />
            <FieldError>{errors.secondaryPassword}</FieldError>
            <p
              id="register-secondary-hint"
              className="text-xs text-muted-foreground"
            >
              {t("auth.secondaryMinHint")} {t("auth.secondaryHint")}
            </p>
          </div>

          {register.isError ? (
            <p
              data-ocid="register.error_state"
              className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {register.error instanceof Error && register.error.message
                ? register.error.message
                : t("common.error")}
            </p>
          ) : null}

          <PrimaryCta
            type="submit"
            data-ocid="register.submit_button"
            disabled={register.isPending}
          >
            {register.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                {t("common.loading")}
              </>
            ) : (
              t("auth.createAccount")
            )}
          </PrimaryCta>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          {t("auth.haveAccount")}{" "}
          <button
            type="button"
            data-ocid="register.login_link"
            onClick={() => void navigate({ to: "/login" })}
            className="font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {t("auth.loginButton")}
          </button>
        </p>
      </main>
    </div>
  );
}
