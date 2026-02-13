import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/auth/admin";
import SwaggerClient from "./SwaggerClient";
import { getOpenApiDocument } from "@/lib/openapi";

export default async function ApiDocsPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const spec = getOpenApiDocument();

  return (
    <main className="p-4">
      <h1 className="text-xl font-semibold mb-4">
        API Documentation
      </h1>
      <SwaggerClient spec={spec} />
    </main>
  );
}
