import type { Metadata } from "next";
import { StudioHome } from "@/components/StudioHome";

export const metadata: Metadata = {
  title: "MaydaLabs — Product & growth studio",
  description:
    "MaydaLabs builds apps, marketplaces, commerce experiences, and growth systems for ambitious founders. Bitcoin-native by proof, founder-focused by design.",
};

export default function HomePage() {
  return <StudioHome />;
}
