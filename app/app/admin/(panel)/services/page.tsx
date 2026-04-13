import { ServicesManager } from "@/components/admin/services-manager";

export default function AdminServicesPage() {
  return (
    <div>
      <h1 className="font-display text-4xl">Services</h1>
      <p className="mt-4 max-w-2xl text-sm text-muted">
        Services power /en/services and /ar/services and the contact form. The live preview reflects your edits immediately (intro text is under Page text).
      </p>
      <ServicesManager />
    </div>
  );
}
