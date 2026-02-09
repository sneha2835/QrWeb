import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/auth/admin";
import { SettingsPanel } from "./SettingsPanel";

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

        {/* 👇 THIS IS WHERE IT BELONGS */}
        <SettingsPanel />

        <form
          action="/api/admin/logout"
          method="POST"
          className="mt-6"
        >
          <button
            type="submit"
            className="w-full rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Logout
          </button>
        </form>
      </section>
    </main>
  );
}
