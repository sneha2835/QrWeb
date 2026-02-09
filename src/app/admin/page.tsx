import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/auth/admin";

export default async function AdminPage() {
  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    redirect("/admin/login");
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-md p-4">
      <section className="rounded-xl bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold">Admin Dashboard</h1>
        <p className="mt-2 text-sm text-slate-600">
          You are authenticated.
        </p>
      </section>
    </main>
  );
}
