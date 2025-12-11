import Link from "next/link";

export default function NotFound() {
  return (
    <div className="space-y-10 md:space-y-12">
      {/* Intro */}
      <section>
        <div className="mx-auto max-w-6xl space-y-3 lg:max-w-7xl">
          <p className="text-[0.75rem] font-medium uppercase tracking-[0.18em] text-muted">
            404 · NOT FOUND
          </p>
          <h1 className="text-2xl font-semibold text-foreground sm:text-3xl md:text-4xl">
            Page not found
          </h1>
          <p className="max-w-2xl text-sm text-muted sm:text-[0.95rem]">
            Either this page never existed, or it&apos;s something we
            haven&apos;t shipped yet.
          </p>
          <p className="max-w-2xl text-xs text-muted sm:text-sm">
            If you were expecting a specific case study or playbook, feel free
            to{" "}
            <Link
              href="/contact"
              className="font-medium text-mayda-teal hover:underline"
            >
              reach out directly
            </Link>
            .
          </p>
        </div>
      </section>

      {/* CTA */}
      <section>
        <div className="mx-auto max-w-6xl lg:max-w-7xl">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-border bg-surface-alt px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-alt/80"
          >
            Back to homepage
          </Link>
        </div>
      </section>
    </div>
  );
}
