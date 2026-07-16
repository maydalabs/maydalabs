"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";

const ROUTES = [
  {
    id: "idea",
    input: "I have an idea",
    label: "New product",
    path: ["Define", "Design", "Build", "Launch"],
    title: "Turn the ambiguity into a credible first release.",
    copy: "Product direction, interface, architecture, and launch decisions move through one connected build.",
    href: "/services#product-builds",
  },
  {
    id: "product",
    input: "My product is stuck",
    label: "Product rebuild",
    path: ["Audit", "Prioritize", "Rebuild", "Measure"],
    title: "Find the constraint, then rebuild around it.",
    copy: "We untangle the product, remove structural friction, and create a clearer path to adoption and iteration.",
    href: "/services#product-builds",
  },
  {
    id: "marketplace",
    input: "I need a marketplace",
    label: "Marketplace system",
    path: ["Supply", "Demand", "Trust", "Transact"],
    title: "Design both sides and the machinery between them.",
    copy: "Discovery, onboarding, availability, trust, transactions, and operations become one product system.",
    href: "/services#product-builds",
  },
  {
    id: "commerce",
    input: "I need commerce",
    label: "Commerce build",
    path: ["Brand", "Storefront", "Operate", "Convert"],
    title: "Build a storefront that behaves like the brand.",
    copy: "We connect customer experience, commerce operations, measurement, and lifecycle instead of stopping at a template.",
    href: "/services#commerce",
  },
  {
    id: "growth",
    input: "Growth is flat",
    label: "Growth system",
    path: ["Instrument", "Learn", "Experiment", "Compound"],
    title: "Replace random activity with a learning system.",
    copy: "Messaging, analytics, conversion, and lifecycle work become a repeatable operating loop around the product.",
    href: "/services#growth-systems",
  },
] as const;

export function ServiceRouter() {
  const [activeId, setActiveId] = useState<(typeof ROUTES)[number]["id"]>("idea");
  const activeRoute = ROUTES.find((route) => route.id === activeId) ?? ROUTES[0];

  return (
    <div className="service-router" data-reveal>
      <div className="service-router-header">
        <span>INPUT / FOUNDER STATE</span>
        <span>ROUTING / MAYDALABS</span>
        <span>OUTPUT / ENGAGEMENT</span>
      </div>

      <div className="service-router-body">
        <div className="service-router-inputs" role="group" aria-label="Choose your starting point">
          {ROUTES.map((route, index) => (
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
          <Link href={activeRoute.href} className="studio-text-link">
            Explore fit and scope <i aria-hidden>↗</i>
          </Link>
        </div>
      </div>
    </div>
  );
}
