import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="min-h-screen p-8">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <nav className="flex gap-4">
          <Link href="/" className="text-sm text-gray-600">Home</Link>
          <Link href="/login" className="text-sm text-gray-600">Log out</Link>
        </nav>
      </header>

      <main>
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 border rounded">Queue overview (placeholder)</div>
          <div className="p-4 border rounded">Active customers (placeholder)</div>
        </section>
      </main>
    </div>
  );
}
