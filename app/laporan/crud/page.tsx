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
    weight: "",
    unit: "kg",
    totalPrice: "",
    image: null as File | null,
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status]);

  useEffect(() => {
    if (id) {
      fetch(`/api/laporan?id=${id}`)
        .then((res) => res.json())
        .then((data) => {
          const item = Array.isArray(data) ? data[0] : data;

          if (!item || !item.date) return;

          const d = new Date(item.date);
          setForm((prev) => ({
            ...prev,
            date: d.toISOString().split("T")[0],
            coffeeType: item.coffeeType,
            weight: item.weightKg.toString(),
            unit: "kg",
            totalPrice: (item.weightKg * 190000).toFixed(0),
          }));

          if (item.image) {
            setPreviewUrl(item.image);
          }
        });
    }
  }, [id]);

  useEffect(() => {
    const weight = parseFloat(form.weight);
    const weightKg = isNaN(weight)
      ? 0
      : form.unit === "gram"
        ? weight / 1000
        : weight;

    const price = weightKg * 199000;
    setForm((prev) => ({ ...prev, totalPrice: price.toFixed(0) }));
  }, [form.weight, form.unit]);

  const handleChange = (e: any) => {
    const { name, value, files } = e.target;

    if (name === "image") {
      const file = files?.[0] ?? null;
      setForm((prev) => ({ ...prev, image: file }));
      setPreviewUrl(file ? URL.createObjectURL(file) : null);
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    const weight = parseFloat(form.weight);
    const weightKg = isNaN(weight)
      ? 0
      : form.unit === "gram"
        ? weight / 1000
        : weight;

    const formData = new FormData();
    formData.append("date", form.date);
    formData.append("coffeeType", form.coffeeType);
    formData.append("weightKg", weightKg.toString());
    formData.append("totalPrice", form.totalPrice);
    if (form.image) formData.append("image", form.image);
    if (id) formData.append("id", id);

    const res = await fetch("/api/laporan", {
      method: id ? "PUT" : "POST",
      body: formData,
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
        <h1 className="text-3xl font-semibold mb-6">
          {id ? "Edit" : "Tambah"} Pembayaran
        </h1>
        <form
          onSubmit={handleSubmit}
          className="bg-gray-50 border rounded-lg shadow-sm w-full p-6 space-y-4"
          encType="multipart/form-data"
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
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">Berat</label>
              <input
                type="number"
                name="weight"
                value={form.weight}
                onChange={handleChange}
                step="0.1"
                className="mt-1 block w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Satuan</label>
              <select
                name="unit"
                value={form.unit}
                onChange={handleChange}
                className="mt-1 block w-full border rounded px-3 py-2"
              >
                <option value="kg">kg</option>
                <option value="gram">gram</option>
              </select>
            </div>
          </div>

   
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Upload Nota / Gambar</label>
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={() => document.getElementById("imageInput")?.click()}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition"
              >
                Pilih Gambar
              </button>
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="h-20 w-20 object-cover border rounded"
                />
              )}
            </div>
            <input
              type="file"
              name="image"
              id="imageInput"
              accept="image/*"
              onChange={handleChange}
              className="hidden"
            />
          </div>
          <label className="block text-sm font-medium text-gray-700">Total Harga</label>
          <input
            type="number"
            name="totalPrice"
            value={form.totalPrice}
            disabled
            className="mt-1 block w-full border rounded px-3 py-2 bg-gray-100 cursor-not-allowed"
          />
          {form.totalPrice && (
            <p className="text-sm text-gray-500 mt-1">
              {formatRupiah(form.totalPrice)}
            </p>
          )}

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
