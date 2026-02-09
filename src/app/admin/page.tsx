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
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Admin Dashboard</h1>

          <form action="/api/admin/logout" method="POST">
            <button
              type="submit"
              className="text-sm font-medium text-red-600 hover:text-red-700"
            >
              Logout
            </button>
          </form>
        </div>

        <p className="mt-4 text-sm text-slate-600">
          You are authenticated.
        </p>
      </section>
    </main>
  );
}
