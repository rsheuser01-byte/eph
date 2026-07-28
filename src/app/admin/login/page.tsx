import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/app/admin/login/AdminLoginForm";
import { isAdminAuthenticated } from "@/lib/admin/auth";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  if (await isAdminAuthenticated()) {
    redirect("/admin/orders");
  }

  return (
    <div className="site-shell py-20">
      <p className="label">Admin</p>
      <h1 className="font-display mt-4 text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
        Sign in
      </h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-soft">
        Enter the admin password to view orders. Access is limited to
        authorized operators.
      </p>
      <AdminLoginForm />
    </div>
  );
}
