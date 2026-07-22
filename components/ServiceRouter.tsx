"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { type Locale, localizePath } from "@/lib/i18n";

const ROUTER_COPY = {
  en: {
    headers: ["INPUT / FOUNDER STATE", "ROUTING / MAYDALABS", "OUTPUT / ENGAGEMENT"], group: "Choose your starting point", link: "Explore fit and scope",
    routes: [
      ["idea", "I have an idea", "New product", ["Define", "Design", "Build", "Launch"], "Turn the ambiguity into a credible first release.", "Product direction, interface, architecture, and launch decisions move through one connected build.", "/services#product-builds"],
      ["product", "My product is stuck", "Product rebuild", ["Audit", "Prioritize", "Rebuild", "Measure"], "Find the constraint, then rebuild around it.", "We untangle the product, remove structural friction, and create a clearer path to adoption and iteration.", "/services#product-builds"],
      ["marketplace", "I need a marketplace", "Marketplace system", ["Supply", "Demand", "Trust", "Transact"], "Design both sides and the machinery between them.", "Discovery, onboarding, availability, trust, transactions, and operations become one product system.", "/services#product-builds"],
      ["commerce", "I need commerce", "Commerce build", ["Brand", "Storefront", "Operate", "Convert"], "Build a storefront that behaves like the brand.", "We connect customer experience, commerce operations, measurement, and lifecycle instead of stopping at a template.", "/services#commerce"],
      ["growth", "Growth is flat", "Growth system", ["Instrument", "Learn", "Experiment", "Compound"], "Replace random activity with a learning system.", "Messaging, analytics, conversion, and lifecycle work become a repeatable operating loop around the product.", "/services#growth-systems"],
    ],
  },
  tr: {
    headers: ["GİRDİ / KURUCU DURUMU", "YÖNLENDİRME / MAYDALABS", "ÇIKTI / ÇALIŞMA"], group: "Başlangıç noktanızı seçin", link: "Uyumu ve kapsamı incele",
    routes: [
      ["idea", "Bir fikrim var", "Yeni ürün", ["Tanımla", "Tasarla", "Geliştir", "Yayınla"], "Belirsizliği güven veren bir ilk sürüme dönüştürün.", "Ürün yönü, arayüz, mimari ve lansman kararları tek bir bağlantılı geliştirme sürecinde ilerler.", "/services#product-builds"],
      ["product", "Ürünüm tıkandı", "Ürün dönüşümü", ["Denetle", "Önceliklendir", "Yenile", "Ölç"], "Kısıtı bulun, sonra ürünü onun etrafında yeniden kurun.", "Ürünü sadeleştirir, yapısal sürtünmeyi kaldırır ve benimsenme ile iterasyon için daha net bir yol kurarız.", "/services#product-builds"],
      ["marketplace", "Bir pazar yeri lazım", "Pazar yeri sistemi", ["Arz", "Talep", "Güven", "İşlem"], "Her iki tarafı ve aradaki mekanizmayı birlikte tasarlayın.", "Keşif, katılım, uygunluk, güven, işlemler ve operasyonlar tek bir ürün sistemine dönüşür.", "/services#product-builds"],
      ["commerce", "E-ticaret lazım", "E-ticaret sistemi", ["Marka", "Mağaza", "İşlet", "Dönüştür"], "Marka gibi davranan bir mağaza kurun.", "Şablonda durmak yerine müşteri deneyimini, operasyonları, ölçümü ve yaşam döngüsünü birbirine bağlarız.", "/services#commerce"],
      ["growth", "Büyüme durdu", "Büyüme sistemi", ["Ölç", "Öğren", "Dene", "Büyüt"], "Rastgele faaliyetleri öğrenen bir sistemle değiştirin.", "Mesaj, analitik, dönüşüm ve yaşam döngüsü ürünün etrafında tekrarlanabilir bir çalışma döngüsüne dönüşür.", "/services#growth-systems"],
    ],
  },
  fr: {
    headers: ["ENTRÉE / ÉTAT DU FONDATEUR", "ORIENTATION / MAYDALABS", "SORTIE / MISSION"], group: "Choisissez votre point de départ", link: "Explorer l’adéquation et le périmètre",
    routes: [
      ["idea", "J’ai une idée", "Nouveau produit", ["Définir", "Concevoir", "Construire", "Lancer"], "Transformer l’ambiguïté en première version crédible.", "Direction produit, interface, architecture et lancement avancent dans une seule construction connectée.", "/services#product-builds"],
      ["product", "Mon produit est bloqué", "Refonte produit", ["Auditer", "Prioriser", "Refondre", "Mesurer"], "Trouver la contrainte, puis reconstruire autour d’elle.", "Nous clarifions le produit, retirons les frictions structurelles et créons un chemin plus net vers l’adoption.", "/services#product-builds"],
      ["marketplace", "Il me faut une marketplace", "Système marketplace", ["Offre", "Demande", "Confiance", "Transaction"], "Concevoir les deux côtés et la mécanique qui les relie.", "Découverte, intégration, disponibilité, confiance, transactions et opérations deviennent un seul système produit.", "/services#product-builds"],
      ["commerce", "Il me faut un e-commerce", "Construction e-commerce", ["Marque", "Boutique", "Opérer", "Convertir"], "Construire une boutique qui se comporte comme la marque.", "Nous relions expérience client, opérations, mesure et cycle de vie au lieu de nous arrêter au template.", "/services#commerce"],
      ["growth", "La croissance stagne", "Système de croissance", ["Instrumenter", "Apprendre", "Tester", "Amplifier"], "Remplacer l’activité aléatoire par un système d’apprentissage.", "Message, analytics, conversion et cycle de vie deviennent une boucle opérationnelle reproductible autour du produit.", "/services#growth-systems"],
    ],
  },
} as const;

export function ServiceRouter({ locale }: { locale: Locale }) {
  const copy = ROUTER_COPY[locale];
  const routes = copy.routes.map(([id, input, label, path, title, description, href]) => ({ id, input, label, path, title, copy: description, href }));
  const [activeId, setActiveId] = useState("idea");
  const activeRoute = routes.find((route) => route.id === activeId) ?? routes[0];

  return (
    <div className="service-router" data-reveal>
      <div className="service-router-header">
        {copy.headers.map((header) => <span key={header}>{header}</span>)}
      </div>

      <div className="service-router-body">
        <div className="service-router-inputs" role="group" aria-label={copy.group}>
          {routes.map((route, index) => (
            <button
              key={route.id}
              type="button"
              className={route.id === activeRoute.id ? "is-active" : ""}
              aria-pressed={route.id === activeRoute.id}
              onClick={() => setActiveId(route.id)}
            >
              <span>0{index + 1}</span>
              {route.input}
              <i aria-hidden>↗</i>
            </button>
          ))}
        </div>

        <div className="service-router-map" aria-hidden="true">
          <div className="service-router-origin"><span /></div>
          <div key={activeRoute.id} className="service-router-path">
            {activeRoute.path.map((step, index) => (
              <div key={step} style={{ "--route-index": index } as CSSProperties}>
                <span>{step}</span>
              </div>
            ))}
          </div>
          <div className="service-router-destination"><span /></div>
        </div>

        <div key={activeRoute.id} className="service-router-output">
          <p>{activeRoute.label}</p>
          <h3>{activeRoute.title}</h3>
          <span>{activeRoute.copy}</span>
          <Link href={localizePath(activeRoute.href, locale)} className="studio-text-link">
            {copy.link} <i aria-hidden>↗</i>
          </Link>
        </div>
      </div>
    </div>
  );
}
