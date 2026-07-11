import type { Metadata } from "next";

type PageMetadata = {
  title: string;
  socialTitle: string;
  description: string;
  path: string;
};

export function createPageMetadata({
  title,
  socialTitle,
  description,
  path,
}: PageMetadata): Metadata {
  return {
    title,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      siteName: "MaydaLabs",
      url: path,
      title: socialTitle,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
    },
  };
}
