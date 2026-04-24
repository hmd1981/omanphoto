import { ServicesManager } from "@/components/admin/services-manager";

export default function AdminServicesPage() {
  return (
    <div>
      <h1 className="font-display text-4xl">Services</h1>
      <p className="mt-4 max-w-2xl text-sm text-muted">
        Services power /en/services and /ar/services and the contact form. The live preview reflects your edits immediately (intro text is under Page text).
      </p>
      <p className="mt-3 max-w-2xl text-sm text-neutral-400">
        <strong className="font-normal text-neutral-300">Service photos:</strong> in each service card, look for the bordered block{" "}
        <span className="text-amber-100/80">Photos · public services page</span> (below the descriptions). Upload, pick from Media, reorder (↑/↓), remove. First image = cover on /en/services and /ar/services. If that block is missing entirely, deploy the latest app build — older bundles only showed text fields.
      </p>
      <ServicesManager />
    </div>
  );
}
