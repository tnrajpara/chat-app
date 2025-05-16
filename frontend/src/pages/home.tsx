import HomeCards from "@/constituents/homecards";

export default function HomePage() {
  return (
    <div>
      <main className="p-6">
        <h1 className="text-3xl font-bold mb-4">Rooms</h1>
        <HomeCards />
      </main>
    </div>
  );
}
