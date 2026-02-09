import { assertServiceIsOpen } from "@/lib/security/service-guard";

export default async function DamPage() {
  try {
    await assertServiceIsOpen();
  } catch {
    return (
      <main className="p-4">
        <p className="text-red-600">
          Service currently unavailable.
        </p>
      </main>
    );
  }

  return (
    <main className="p-4">
      <p>Service is open. Menu coming next.</p>
    </main>
  );
}
