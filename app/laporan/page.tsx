"use client";

import { useEffect, useState } from "react";
import { useSession, signOut, SessionProvider } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

interface Payment {
  id: number;
  date: string;
  coffeeType: string;
  weightKg: number;
  totalPrice: number;
  image?: string;
  user: {
    email: string;
  };
}

export default function LaporanPageWrapper() {
  return (
    <SessionProvider>
      <LaporanPage />
    </SessionProvider>
  );
}

function LaporanPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/laporan")
        .then((res) => res.json())
        .then((data) => setPayments(data))
        .finally(() => setLoading(false));
    }
  }, [status]);

  const handleDelete = async (id: number) => {
    const confirmDelete = confirm("Yakin ingin menghapus data ini?");
    if (!confirmDelete) return;

    const res = await fetch("/api/laporan", {
      method: "DELETE",
      body: JSON.stringify({ id }),
    });

    if (res.ok) {
      setPayments((prev) => prev.filter((p) => p.id !== id));
    } else {
      alert("Gagal menghapus data.");
    }
  };

  const generateExcel = async (data: Payment[], filename: string) => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Laporan");

    sheet.mergeCells("A1", "F1");
    const titleCell = sheet.getCell("A1");
    titleCell.value = "LAPORAN PEMBAYARAN KASIR KOPI";
    titleCell.font = { size: 18, bold: true };
    titleCell.alignment = { horizontal: "center" };
    titleCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF92D050" },
    };

    sheet.addRow([]);

    const headers = ["No", "Tanggal", "Jenis Kopi", "Berat (kg)", "Total Harga", "User"];
    const headerRow = sheet.addRow(headers);
    headerRow.font = { bold: true, size: 12 };
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFD9E1F2" },
      };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      cell.alignment = { horizontal: "center" };
    });

    data.forEach((p, i) => {
      const row = sheet.addRow([
        i + 1,
        new Date(p.date).toLocaleDateString("id-ID"),
        p.coffeeType,
        `${p.weightKg} kg`,
        p.totalPrice,
        p.user?.email ?? "-",
      ]);
      row.font = { size: 11 };
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    const totalHarga = data.reduce((sum, p) => sum + p.totalPrice, 0);
    const totalRow = sheet.addRow(["", "", "", "TOTAL", totalHarga, ""]);
    totalRow.font = { bold: true };
    totalRow.getCell(5).numFmt = '"Rp"#,##0';
    totalRow.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    (sheet.columns as ExcelJS.Column[]).forEach((col) => {
      let maxLength = 10;
      col.eachCell?.({ includeEmpty: true }, (cell) => {
        const value = cell.value?.toString() ?? "";
        maxLength = Math.max(maxLength, value.length);
      });
      col.width = maxLength + 2;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, filename);
  };

  const exportLaporanExcel = () => {
    const bulan = new Date().toLocaleString("id-ID", { month: "long" }).toLowerCase();
    const tahun = new Date().getFullYear();
    const fileName = `laporan_excel_${bulan}_${tahun}.xlsx`;
    generateExcel(payments, fileName);
  };

  const exportLaporanPerBulan = () => {
    const filtered = payments.filter((p) => {
      const tgl = new Date(p.date);
      return (
        tgl.getMonth() === selectedMonth &&
        tgl.getFullYear() === selectedYear
      );
    });

    const bulan = new Date(0, selectedMonth).toLocaleString("id-ID", {
      month: "long",
    }).toLowerCase();

    const fileName = `laporan_excel_${bulan}_${selectedYear}.xlsx`;
    generateExcel(filtered, fileName);
  };

  if (status === "loading" || loading) return <p className="p-6">Loading...</p>;

  const totalHarga = payments.reduce((sum, p) => sum + p.totalPrice, 0);
  const totalKg = payments.reduce((sum, p) => sum + p.weightKg, 0);

  return (
    <div className="flex min-h-screen text-gray-900">
      <aside className="w-64 bg-gray-900 text-white flex flex-col justify-between h-screen fixed">
        <div>
          <div className="px-4 py-4 text-lg font-bold border-b border-gray-700">
            ☕ Kasir Kopi
          </div>
          <nav className="mt-4 px-2 space-y-1">
            <Link href="/" className="block px-4 py-2 rounded hover:bg-gray-800">📊 Dashboard</Link>
            <Link href="/laporan" className="block px-4 py-2 rounded bg-gray-800">📁 Laporan</Link>
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

      <main className="ml-64 flex-1 bg-white p-8">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
          <h1 className="text-3xl font-semibold">Laporan Pembayaran</h1>
          <div className="flex gap-2 items-center">
            <Link
              href="/laporan/crud"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              + Tambah Data
            </Link>

            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="border px-2 py-1 text-sm rounded"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i}>
                  {new Date(0, i).toLocaleString("id-ID", { month: "long" })}
                </option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="border px-2 py-1 text-sm rounded"
            >
              {Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() - i;
                return (
                  <option key={year} value={year}>
                    {year}
                  </option>
                );
              })}
            </select>

            <button
              onClick={exportLaporanPerBulan}
              className="bg-green-700 text-white px-3 py-2 rounded hover:bg-green-800 text-sm"
            >
              Export Bulan Terpilih
            </button>

            <button
              onClick={exportLaporanExcel}
              className="bg-gray-700 text-white px-3 py-2 rounded hover:bg-gray-800 text-sm"
            >
              Export Semua
            </button>
          </div>
        </div>

        <div className="overflow-auto border rounded-lg shadow-sm">
          <table className="w-full text-sm text-left table-auto">
            <thead className="bg-gray-100 border-b text-gray-600 uppercase text-xs">
              <tr>
                <th className="p-3">Tanggal</th>
                <th className="p-3">Jenis Kopi</th>
                <th className="p-3">Berat (kg)</th>
                <th className="p-3">Total Harga</th>
                <th className="p-3">Nota</th>
                <th className="p-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{new Date(p.date).toLocaleDateString()}</td>
                  <td className="p-3">{p.coffeeType}</td>
                  <td className="p-3">{p.weightKg} kg</td>
                  <td className="p-3">Rp {p.totalPrice.toLocaleString()}</td>
                  <td className="p-3">
                    {p.image ? (
                      <a
                        href={p.image}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                      >
                        Lihat
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="p-3 space-x-2">
                    <Link
                      href={`/laporan/crud?id=${p.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="text-red-600 hover:underline"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-3 text-center text-gray-500">
                    Belum ada data pembayaran.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-sm text-gray-700 border-t pt-4">
          <div className="flex justify-between max-w-sm">
            <span className="font-semibold">Total Harga:</span>
            <span>Rp {totalHarga.toLocaleString()}</span>
          </div>
          <div className="flex justify-between max-w-sm">
            <span className="font-semibold">Total Berat:</span>
            <span>{totalKg} kg</span>
          </div>
        </div>
      </main>
    </div>
  );
}
