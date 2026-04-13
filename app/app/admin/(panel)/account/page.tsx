import { ChangePasswordForm } from "@/components/admin/change-password-form";

export default function AdminAccountPage() {
  return (
    <div>
      <h1 className="font-display text-4xl">Account security</h1>
      <p className="mt-4 max-w-2xl text-sm text-muted">
        Change your admin password here. Password reset does not require re-seeding the database.
      </p>
      <ChangePasswordForm />
    </div>
  );
}
