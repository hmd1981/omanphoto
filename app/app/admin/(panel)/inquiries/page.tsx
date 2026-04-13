import { InquiriesManager } from "@/components/admin/inquiries-manager";

export const dynamic = "force-dynamic";

export default function AdminInquiriesPage() {
  return (
    <div>
      <h1 className="font-display text-4xl">Inquiries</h1>
      <p className="mt-4 text-sm text-muted">Contact form submissions. Update status as you respond.</p>
      <InquiriesManager />
    </div>
  );
}
