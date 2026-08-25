import { MaydaOS } from "@/components/os/MaydaOS";
import { createPageMetadata } from "@/lib/metadata";
import { getPageLocale, type LocalePageProps } from "@/lib/localePage";

const META = {
  en: {
    title: "MaydaLabs — Product & growth studio",
    socialTitle: "MaydaLabs — Software people can feel",
    description: "MaydaLabs builds apps, marketplaces, commerce experiences, and growth systems for ambitious founders. Bitcoin-native by proof, founder-focused by design.",
  },
  tr: {
    title: "MaydaLabs — Ürün ve büyüme stüdyosu",
    socialTitle: "MaydaLabs — İnsanların hissedebileceği yazılımlar",
    description: "MaydaLabs; iddialı kurucular için uygulamalar, pazar yerleri, e-ticaret deneyimleri ve büyüme sistemleri geliştirir. Kanıtımız Bitcoin-native projeler, odağımız kurucular.",
  },
  fr: {
    title: "MaydaLabs — Studio produit et croissance",
    socialTitle: "MaydaLabs — Du logiciel que l’on ressent",
    description: "MaydaLabs conçoit des applications, des marketplaces, des expériences e-commerce et des systèmes de croissance pour des fondateurs ambitieux. Bitcoin-native par les preuves, pensé pour les fondateurs.",
  },
} as const;

export async function generateMetadata({ params }: LocalePageProps) {
  const locale = await getPageLocale(params);
  return createPageMetadata({ ...META[locale], path: "/", locale, socialCard: "studio" });
}

export default async function HomePage({ params }: LocalePageProps) {
  const locale = await getPageLocale(params);
  return <MaydaOS locale={locale} />;
}
