import { redirect } from "next/navigation";
import { SignInForm } from "@/components/SignInForm";
import { getVerifiedClaims } from "@/lib/supabase/server";
import { localizePath } from "@/lib/i18n";
import { getPageLocale, type LocalePageProps } from "@/lib/localePage";
import { createPageMetadata } from "@/lib/metadata";

const COPY = {
  en: {
    meta: {
      title: "Sign in",
      socialTitle: "Sign in · MaydaLabs",
      description: "Sign in to MaydaLabs with a one-time email code. No password.",
    },
    kicker: "Account / Email code",
    heading: "Sign in without a password.",
    intro:
      "Enter your email and we send a one-time code. New here? The same flow creates your account — it's used only for your saved Multiplier Maps, briefs, and preferences.",
    form: {
      emailLabel: "Email",
      emailPlaceholder: "you@company.com",
      sendCode: "Send code",
      codeSentTo: "Code sent to",
      codeLabel: "Code from the email",
      codeHint: "Check your inbox and enter the code.",
      verify: "Verify and sign in",
      changeEmail: "Use a different email",
      errors: {
        invalid_email: "Add a valid email address.",
        rate_limited: "Too many attempts. Wait a few minutes and try again.",
        send_failed: "The code could not be sent. Try again in a moment.",
        invalid_code: "Enter the code from the email.",
        verify_failed: "That code didn't verify. Check it or request a new one.",
      },
    },
    linkError: "That sign-in link was invalid or expired. Request a fresh code below.",
  },
  tr: {
    meta: {
      title: "Giriş yap",
      socialTitle: "Giriş yap · MaydaLabs",
      description: "MaydaLabs'e tek kullanımlık e-posta koduyla giriş yapın. Parola yok.",
    },
    kicker: "Hesap / E-posta kodu",
    heading: "Parolasız giriş yapın.",
    intro:
      "E-postanızı girin, tek kullanımlık bir kod gönderelim. İlk kez mi? Aynı akış hesabınızı oluşturur — yalnızca kayıtlı Multiplier Map'leriniz, brief'leriniz ve tercihleriniz için kullanılır.",
    form: {
      emailLabel: "E-posta",
      emailPlaceholder: "siz@sirket.com",
      sendCode: "Kodu gönder",
      codeSentTo: "Kod gönderildi:",
      codeLabel: "E-postadaki kod",
      codeHint: "Gelen kutunuzu kontrol edin ve kodu girin.",
      verify: "Doğrula ve giriş yap",
      changeEmail: "Farklı bir e-posta kullan",
      errors: {
        invalid_email: "Geçerli bir e-posta adresi ekleyin.",
        rate_limited: "Çok fazla deneme. Birkaç dakika bekleyip tekrar deneyin.",
        send_failed: "Kod gönderilemedi. Az sonra tekrar deneyin.",
        invalid_code: "E-postadaki kodu girin.",
        verify_failed: "Kod doğrulanamadı. Kontrol edin veya yeni kod isteyin.",
      },
    },
    linkError: "Giriş bağlantısı geçersiz veya süresi dolmuş. Aşağıdan yeni bir kod isteyin.",
  },
  fr: {
    meta: {
      title: "Se connecter",
      socialTitle: "Se connecter · MaydaLabs",
      description: "Connectez-vous à MaydaLabs avec un code e-mail à usage unique. Sans mot de passe.",
    },
    kicker: "Compte / Code e-mail",
    heading: "Connectez-vous sans mot de passe.",
    intro:
      "Entrez votre e-mail et nous envoyons un code à usage unique. Première visite ? Le même flux crée votre compte — utilisé uniquement pour vos Multiplier Maps, briefs et préférences.",
    form: {
      emailLabel: "E-mail",
      emailPlaceholder: "vous@entreprise.com",
      sendCode: "Envoyer le code",
      codeSentTo: "Code envoyé à",
      codeLabel: "Code reçu par e-mail",
      codeHint: "Vérifiez votre boîte de réception et saisissez le code.",
      verify: "Vérifier et se connecter",
      changeEmail: "Utiliser un autre e-mail",
      errors: {
        invalid_email: "Ajoutez une adresse e-mail valide.",
        rate_limited: "Trop de tentatives. Attendez quelques minutes puis réessayez.",
        send_failed: "Le code n’a pas pu être envoyé. Réessayez dans un instant.",
        invalid_code: "Saisissez le code reçu par e-mail.",
        verify_failed: "Ce code n’a pas été vérifié. Vérifiez-le ou demandez-en un nouveau.",
      },
    },
    linkError: "Ce lien de connexion est invalide ou expiré. Demandez un nouveau code ci-dessous.",
  },
} as const;

export async function generateMetadata({ params }: LocalePageProps) {
  const locale = await getPageLocale(params);
  return createPageMetadata({ ...COPY[locale].meta, path: "/auth/sign-in", locale, socialCard: "auth" });
}

export default async function SignInPage({
  params,
  searchParams,
}: LocalePageProps & { searchParams: Promise<{ error?: string; next?: string }> }) {
  const locale = await getPageLocale(params);
  const copy = COPY[locale];
  const query = await searchParams;
  const showLinkError = query.error === "confirm";
  // Same-site relative paths only, never protocol-relative ones: this value
  // decides where somebody lands after proving their email.
  const nextPath =
    typeof query.next === "string" && query.next.startsWith("/") && !query.next.startsWith("//")
      ? query.next
      : "/portal";

  const claims = await getVerifiedClaims();
  // Already signed in: honour the deep link rather than dropping them on the portal.
  if (claims) redirect(localizePath(nextPath, locale));

  return (
    <div className="mayda-shell mayda-section" style={{ maxWidth: "34rem" }}>
      <div className="mayda-stack-lg">
        <header className="mayda-stack">
          <p className="mayda-kicker">{copy.kicker}</p>
          <h1 className="mayda-heading">{copy.heading}</h1>
          <p className="mayda-body">{copy.intro}</p>
        </header>
        {showLinkError ? (
          <p className="mayda-form-status is-error" role="alert">
            {copy.linkError}
          </p>
        ) : null}
        <SignInForm locale={locale} nextPath={nextPath} copy={copy.form} />
      </div>
    </div>
  );
}
