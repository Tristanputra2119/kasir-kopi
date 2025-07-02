"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useEffect, useState } from "react";
import { SessionProvider, useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface GrowthStats {
  total: number;
  kg: number;
  avg: number;
}

export default function Page() {
  return (
    <SessionProvider>
      <DashboardPage />
    </SessionProvider>
  );
}



function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();


  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status]);

  const [stats, setStats] = useState({
    total: 0,
    totalKg: 0,
    avg: 0,
    growth: {
      total: 0,
      kg: 0,
      avg: 0,
    } as GrowthStats,
  });
  const [pieData, setPieData] = useState<{ type: string; value: number }[]>([]);
  const [barData, setBarData] = useState<{ month: string; total: number }[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status]);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((data) => {
        setStats(data.stats);
        setPieData(data.pieData);
        setBarData(data.barData);
      });
  }, []);

  const COLORS = ["#10b981", "#3b82f6", "#facc15", "#f97316", "#a78bfa"];

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

      {/* Main Content */}
      <main className="ml-64 flex-1 bg-white p-8">
        <h1 className="text-3xl font-semibold mb-8"> Dashboard</h1>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <StatCard
            label="Total Penjualan"
            value={`Rp ${stats.total.toLocaleString()}`}
            growth={stats.growth.total}
          />
          <StatCard
            label="Total Kg Terjual"
            value={`${stats.totalKg} kg`}
            growth={stats.growth.kg}
          />
          <StatCard
            label="Rata-rata Transaksi"
            value={`Rp ${stats.avg.toLocaleString()}`}
            growth={stats.growth.avg}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gray-50 border rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-medium mb-4">
              Penjualan Berdasarkan Jenis Kopi
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  dataKey="value"
                  nameKey="type"
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-gray-50 border rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-medium mb-4">Total Penjualan per Bulan</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar
                  dataKey="total"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  growth,
}: {
  label: string;
  value: string;
  growth: number;
}) {
  const isPositive = growth >= 0;
  const growthText = `${isPositive ? "↑" : "↓"} ${Math.abs(growth).toFixed(2)}%`;

  return (
    <div className="bg-gray-50 border rounded-lg p-6 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
      <p
        className={`text-sm mt-1 ${
          isPositive ? "text-green-600" : "text-red-600"
        }`}
      >
        {growthText} dibanding 30 hari lalu
      </p>
    </div>
  );
}
