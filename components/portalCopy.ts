import type { Locale } from "@/lib/i18n";

/* Account copy, shared by the MaydaOS Account app. Lifted out of the old
 * portal page when the portal became one app inside the operating system. */

export const PORTAL_COPY = {
  en: {
    meta: {
      title: "Your portal",
      socialTitle: "Your portal · MaydaLabs",
      description: "Saved Multiplier Maps, submitted briefs, and your preferences.",
    },
    kicker: "Portal",
    heading: "Your maps, briefs, and preferences.",
    signedInAs: "Signed in as",
    signOut: "Sign out",
    mapsHeading: "Saved Multiplier Maps",
    mapsEmpty: "No saved maps yet. Run the Multiplier Map and save the result here.",
    mapsCta: "Run the Multiplier Map",
    view: "View",
    delete: "Delete",
    briefsHeading: "Submitted briefs",
    briefsEmpty: "No briefs yet. When you send one — from the map or the contact page — its status appears here.",
    statuses: {
      new: "Received",
      reviewing: "Being reviewed",
      needs_info: "Awaiting your reply",
      transferred: "In progress",
      closed: "Closed",
    } as Record<string, string>,
    subscriptionHeading: "Email updates",
    subscriptionNote:
      "Free, occasional product and build updates. No emails are being sent yet — your preference is stored and honored when sending starts.",
    subscription: {
      checkbox: "Send me occasional updates by email.",
      save: "Save preference",
      saved: "Saved",
      failed: "Saving failed. Try again.",
    },
    profileHeading: "Profile and privacy",
    profileNote:
      "Optional details that give your submissions context. Stored data: your email, these fields, saved maps, and submitted briefs — nothing else. To delete your account and data, email info@maydalabs.com from this address.",
    profile: {
      displayName: "Name",
      companyName: "Company",
      jobRole: "Role",
      save: "Save profile",
      saved: "Saved",
      failed: "Saving failed. Try again.",
    },
  },
  tr: {
    meta: {
      title: "Portalınız",
      socialTitle: "Portalınız · MaydaLabs",
      description: "Kayıtlı Multiplier Map'ler, gönderilmiş brief'ler ve tercihleriniz.",
    },
    kicker: "Portal",
    heading: "Haritalarınız, brief'leriniz ve tercihleriniz.",
    signedInAs: "Giriş yapan:",
    signOut: "Çıkış yap",
    mapsHeading: "Kayıtlı Multiplier Map'ler",
    mapsEmpty: "Henüz kayıtlı harita yok. Multiplier Map'i çalıştırın ve sonucu buraya kaydedin.",
    mapsCta: "Multiplier Map'i çalıştır",
    view: "Görüntüle",
    delete: "Sil",
    briefsHeading: "Gönderilen brief'ler",
    briefsEmpty: "Henüz brief yok. Haritadan veya iletişim sayfasından gönderdiğinizde durumu burada görünür.",
    statuses: {
      new: "Alındı",
      reviewing: "İnceleniyor",
      needs_info: "Yanıtınız bekleniyor",
      transferred: "Devam ediyor",
      closed: "Kapandı",
    } as Record<string, string>,
    subscriptionHeading: "E-posta güncellemeleri",
    subscriptionNote:
      "Ücretsiz, ara sıra ürün ve geliştirme güncellemeleri. Henüz e-posta gönderilmiyor — tercihiniz saklanır ve gönderim başladığında uygulanır.",
    subscription: {
      checkbox: "Bana ara sıra e-posta ile güncelleme gönderin.",
      save: "Tercihi kaydet",
      saved: "Kaydedildi",
      failed: "Kaydetme başarısız. Tekrar deneyin.",
    },
    profileHeading: "Profil ve gizlilik",
    profileNote:
      "Gönderimlerinize bağlam katan opsiyonel bilgiler. Saklanan veriler: e-postanız, bu alanlar, kayıtlı haritalar ve gönderilen brief'ler — başka bir şey yok. Hesabınızı ve verilerinizi silmek için bu adresten info@maydalabs.com'a yazın.",
    profile: {
      displayName: "Ad",
      companyName: "Şirket",
      jobRole: "Rol",
      save: "Profili kaydet",
      saved: "Kaydedildi",
      failed: "Kaydetme başarısız. Tekrar deneyin.",
    },
  },
  fr: {
    meta: {
      title: "Votre portail",
      socialTitle: "Votre portail · MaydaLabs",
      description: "Multiplier Maps enregistrées, briefs envoyés et vos préférences.",
    },
    kicker: "Portail",
    heading: "Vos cartes, briefs et préférences.",
    signedInAs: "Connecté en tant que",
    signOut: "Se déconnecter",
    mapsHeading: "Multiplier Maps enregistrées",
    mapsEmpty: "Aucune carte enregistrée. Lancez la Multiplier Map et enregistrez le résultat ici.",
    mapsCta: "Lancer la Multiplier Map",
    view: "Voir",
    delete: "Supprimer",
    briefsHeading: "Briefs envoyés",
    briefsEmpty: "Aucun brief pour l’instant. Quand vous en envoyez un — depuis la carte ou la page contact — son statut apparaît ici.",
    statuses: {
      new: "Reçu",
      reviewing: "En cours d’examen",
      needs_info: "En attente de votre réponse",
      transferred: "En cours",
      closed: "Clos",
    } as Record<string, string>,
    subscriptionHeading: "Nouvelles par e-mail",
    subscriptionNote:
      "Des nouvelles gratuites et occasionnelles des produits et des builds. Aucun e-mail n’est encore envoyé — votre préférence est enregistrée et respectée quand l’envoi commencera.",
    subscription: {
      checkbox: "Envoyez-moi des nouvelles occasionnelles par e-mail.",
      save: "Enregistrer la préférence",
      saved: "Enregistré",
      failed: "Échec de l’enregistrement. Réessayez.",
    },
    profileHeading: "Profil et confidentialité",
    profileNote:
      "Des détails optionnels qui donnent du contexte à vos envois. Données conservées : votre e-mail, ces champs, les cartes enregistrées et les briefs envoyés — rien d’autre. Pour supprimer votre compte et vos données, écrivez à info@maydalabs.com depuis cette adresse.",
    profile: {
      displayName: "Nom",
      companyName: "Entreprise",
      jobRole: "Rôle",
      save: "Enregistrer le profil",
      saved: "Enregistré",
      failed: "Échec de l’enregistrement. Réessayez.",
    },
  },
} as const;

export type PortalCopy = (typeof PORTAL_COPY)[Locale];
