import { notFound } from "next/navigation";
import { ServiceLanding } from "@/components/ServiceLanding";
import { getPageLocale } from "@/lib/localePage";
import { createPageMetadata } from "@/lib/metadata";
import { SERVICE_IDS, SERVICES } from "@/lib/services";
import { SERVICE_SLUGS, serviceFromSlug, servicePath } from "@/lib/servicePages";

type Props = { params: Promise<{ lang: string; slug: string }> };

export function generateStaticParams() {
  return SERVICE_IDS.map(id => ({ slug: SERVICE_SLUGS[id] }));
}

async function resolve({ params }: Props) {
  const locale = await getPageLocale(params);
  const { slug } = await params;
  const id = serviceFromSlug(slug);
  if (!id) notFound();
  return { locale, id };
}

export async function generateMetadata(props: Props) {
  const { locale, id } = await resolve(props);
  const service = SERVICES[locale].find(item => item.id === id)!;
  return createPageMetadata({ title: service.title, socialTitle: service.title, description: service.summary, path: servicePath(id), locale, socialCard: "approach" });
}

export default async function ServicePage(props: Props) {
  const { locale, id } = await resolve(props);
  return <ServiceLanding id={id} locale={locale}/>;
}
