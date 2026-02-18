// src/app/dam/page.tsx

import DamClient from "./DamClient";
import { getDamMenu } from "@/lib/db/menu";

type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
};

export default async function DamPage() {
  let items: MenuItem[] = [];

  try {
    items = await getDamMenu();
  } catch {
    return (
      <main className="mx-auto min-h-screen w-full max-w-md p-4">
        <p className="text-center text-red-600">
          Unable to load menu. Please try again later.
        </p>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-md p-4">
        <p className="text-center text-slate-600">
          Menu coming soon.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-md p-4 space-y-6">
      <h1 className="text-xl font-semibold">
        CityLink Cafe — Dam Menu
      </h1>

      <DamClient
        items={items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
        }))}
      />
    </main>
  );
}
