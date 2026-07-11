import { StudioHome } from "@/components/StudioHome";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "MaydaLabs — Product & growth studio",
  socialTitle: "MaydaLabs — Software people can feel",
  description:
    "MaydaLabs builds apps, marketplaces, commerce experiences, and growth systems for ambitious founders. Bitcoin-native by proof, founder-focused by design.",
  path: "/",
});

export default function HomePage() {
  return <StudioHome />;
}
