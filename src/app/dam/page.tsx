import { assertServiceIsOpen } from "@/lib/security/service-guard";

type MenuItem = {
  id: number;
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
  try {

  } catch {
    return (
      <main className="mx-auto min-h-screen w-full max-w-md p-4">
        <p className="text-center text-red-600">
          Service currently unavailable.
        </p>
      </main>
    );
  }

  let items: MenuItem[] = [];
  try {
    items = await fetchMenu();
  } catch {
    return (
      <main className="mx-auto min-h-screen w-full max-w-md p-4">
        <p className="text-center text-red-600">
          Unable to load menu.
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

  // Group by category
  const grouped = items.reduce<Record<string, MenuItem[]>>((acc, item) => {
    acc[item.category] = acc[item.category] || [];
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <main className="mx-auto min-h-screen w-full max-w-md p-4 space-y-6">
      <h1 className="text-xl font-semibold">CityLink Cafe — Dam Menu</h1>

      {Object.entries(grouped).map(([category, items]) => (
        <section key={category}>
          <h2 className="mb-2 text-lg font-medium">{category}</h2>
          <ul className="space-y-3">
            {items.map(item => (
              <li
                key={item.id}
                className="rounded-lg border p-3"
              >
                <div className="flex justify-between">
                  <span className="font-medium">{item.name}</span>
                  <span>₹{item.price}</span>
                </div>
                {item.description && (
                  <p className="mt-1 text-sm text-slate-600">
                    {item.description}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
