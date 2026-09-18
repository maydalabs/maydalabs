"use client";

import { useRef, useTransition } from "react";
import { notify } from "@/components/os/notice";

/* A form that says what it did.
 *
 * The lifecycle forms were plain submissions, which is right for a page and
 * wrong for a desk: a page navigates, so you see it working; a desk stays
 * where it is, so a button that gives nothing back looks broken until the
 * window quietly changes. This runs the same server action inside a
 * transition — the button dims while it works — and raises a notice when it
 * is done. The action itself is unchanged, and so is what the database says
 * yes or no to.
 *
 * Which button was pressed still reaches the action: the submitter's name
 * and value are added to the form data, as a plain submit would.
 */
export function ActionForm({
  action,
  done,
  className,
  children,
}: {
  action: (formData: FormData) => Promise<void>;
  /* The notice raised when the action returns — one string, or one per
   * submit button, keyed by the button's value. */
  done: string | Record<string, string>;
  className?: string;
  children: React.ReactNode;
}) {
  const [pending, start] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      className={className}
      data-pending={pending || undefined}
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const data = new FormData(form);
        const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
        if (submitter?.name) data.set(submitter.name, submitter.value);
        const said = typeof done === "string" ? done : (done[submitter?.value ?? ""] ?? "");
        start(async () => {
          await action(data);
          form.reset();
          if (said) notify(said);
        });
      }}
    >
      {children}
    </form>
  );
}
