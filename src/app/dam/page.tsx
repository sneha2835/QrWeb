import DamClient from "./DamClient";

type MenuItem = {
  id: string; // UUID
  name: string;
  description: string | null;
  price: number;
  category: string;
};

async function fetchMenu(): Promise<MenuItem[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/menu`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Service unavailable");
  }

  const data = await res.json();
  return data.items;
}

export default async function DamPage() {
  let items: MenuItem[] = [];

  try {
    items = await fetchMenu();
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

      {/* Client-side cart + checkout */}
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
