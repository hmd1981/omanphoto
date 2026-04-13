"use client";

/**
 * Explicit opt-in: copies English field values into Arabic fields only where Arabic is empty.
 * Does not auto-run on save — editors choose when to use it.
 */
export function CopyEnToArButton({
  formId,
  label = "Fill empty Arabic from English",
}: {
  formId: string;
  label?: string;
}) {
  return (
    <button
      type="button"
      className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 underline-offset-4 hover:text-white hover:underline"
      onClick={() => {
        const form = document.getElementById(formId);
        if (!form || !(form instanceof HTMLFormElement)) return;
        for (const base of ["title", "body", "name", "description"]) {
          const en = form.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[name="${base}En"]`);
          const ar = form.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[name="${base}Ar"]`);
          if (en && ar && !ar.value.trim() && en.value.trim()) {
            ar.value = en.value;
          }
        }
      }}
    >
      {label}
    </button>
  );
}
