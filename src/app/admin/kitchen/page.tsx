import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/auth/admin";
import { KitchenClient } from "./KitchenClient";

export default async function KitchenPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl p-4">
      <h1 className="text-2xl font-bold mb-4">Kitchen Screen</h1>
      <KitchenClient />
    </main>
  );
}
