"use client";

import { useState, useEffect } from "react";
import { useSession, signOut, SessionProvider } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function CrudWrapper() {
  return (
    <SessionProvider>
      <CrudPage />
    </SessionProvider>
  );
}

function CrudPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const { data: session, status } = useSession();

  const [form, setForm] = useState({
    date: "",
    coffeeType: "kopi bubuk",
    weightKg: "",
    totalPrice: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status]);

  useEffect(() => {
    if (id) {
      fetch(`/api/laporan?id=${id}`)
        .then((res) => res.json())
        .then((data) => {
          const item = Array.isArray(data) ? data[0] : data;

          if (!item || !item.date) {
            console.error("Data tidak ditemukan atau date kosong:", data);
            return;
          }

          const d = new Date(item.date);
          if (isNaN(d.getTime())) {
            console.error("Tanggal tidak valid:", item.date);
            return;
          }

          setForm({
            date: d.toISOString().split("T")[0],
            coffeeType: item.coffeeType,
            weightKg: item.weightKg.toString(),
            totalPrice: item.totalPrice.toString(),
          });
        })
        .catch((err) => {
          console.error("Gagal ambil data edit:", err);
        });
    }
  }, [id]);

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const res = await fetch("/api/laporan", {
      method: id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        weightKg: parseFloat(form.weightKg),
        totalPrice: parseInt(form.totalPrice),
        id,
      }),
    });
    if (res.ok) router.push("/laporan");
  };

  const formatRupiah = (value: string) => {
    return "Rp " + Number(value).toLocaleString("id-ID");
  };

  if (status === "loading") return <p className="p-6">Loading...</p>;

  return (
    <div className="flex min-h-screen text-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col justify-between h-screen fixed">
        <div>
          <div className="px-4 py-4 text-lg font-bold border-b border-gray-700">
            ☕ Kasir Kopi
          </div>
          <nav className="mt-4 px-2 space-y-1">
            <Link href="/" className="block px-4 py-2 rounded hover:bg-gray-800">📊 Dashboard</Link>
            <Link href="/laporan" className="block px-4 py-2 rounded hover:bg-gray-800">📁 Laporan</Link>
          </nav>
        </div>
        <div className="p-4 border-t border-gray-700 text-sm">
          <div className="text-gray-400 truncate mb-2">👤 {session?.user?.email}</div>
          <button
            onClick={() => signOut()}
            className="w-full bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-white text-sm"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Form */}
      <main className="ml-64 flex-1 bg-white p-8">
        <h1 className="text-3xl font-semibold mb-6">{id ? "Edit" : "Tambah"} Pembayaran</h1>
        <form
          onSubmit={handleSubmit}
          className="bg-gray-50 border rounded-lg shadow-sm w-full p-6 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700">Tanggal</label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              className="mt-1 block w-full border rounded px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Jenis Kopi</label>
            <select
              name="coffeeType"
              value={form.coffeeType}
              onChange={handleChange}
              className="mt-1 block w-full border rounded px-3 py-2"
              required
            >
              <option value="kopi bubuk">Kopi Bubuk</option>
              <option value="kopi bijian">Kopi Bijian</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Berat (kg)</label>
            <input
              type="number"
              name="weightKg"
              value={form.weightKg}
              onChange={handleChange}
              step="0.1"
              className="mt-1 block w-full border rounded px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Total Harga</label>
            <input
              type="number"
              name="totalPrice"
              value={form.totalPrice}
              onChange={handleChange}
              className="mt-1 block w-full border rounded px-3 py-2"
              required
            />
            {form.totalPrice && (
              <p className="text-sm text-gray-500 mt-1">
                {formatRupiah(form.totalPrice)}
              </p>
            )}
          </div>
          <div className="pt-4">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Simpan
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
