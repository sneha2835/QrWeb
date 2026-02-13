import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/auth/admin";
import { OrdersClient } from "./OrdersClient";

export default async function AdminOrdersPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl p-4">
      <h1 className="text-xl font-semibold mb-4">Orders</h1>
      <OrdersClient />
    </main>
  );
}
