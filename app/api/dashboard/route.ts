import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@/app/generated/prisma"; // ✅ sesuai yang kamu generate
const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const payments = await prisma.payment.findMany({
      where: {
        userId: user.id,
      },
    });

    const total = payments.reduce((acc, p) => acc + p.totalPrice, 0);
    const totalKg = payments.reduce((acc, p) => acc + p.weightKg, 0);
    const avg = payments.length > 0 ? total / payments.length : 0;

   const coffeeTypes = ["Kopi Bubuk", "Kopi Bijian"];

const pieData = coffeeTypes.map((type) => {
  const total = payments
    .filter((p) => p.coffeeType?.toLowerCase() === type.toLowerCase())
    .reduce((sum, p) => sum + p.totalPrice, 0);
  return { type, value: total };
});

    // Bar chart berdasarkan bulan
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    const barMap: Record<string, number> = {};
    payments.forEach((p) => {
      const month = new Date(p.date).getMonth(); // 0–11
      const key = monthNames[month];
      barMap[key] = (barMap[key] || 0) + p.totalPrice;
    });

    const barData = monthNames.map((name) => ({
      month: name,
      total: barMap[name] || 0,
    }));

    // Hitung pertumbuhan (growth) dibandingkan 30 hari sebelumnya
    const now = new Date();
    const THIRTY_DAYS_AGO = new Date();
    THIRTY_DAYS_AGO.setDate(now.getDate() - 30);
    const SIXTY_DAYS_AGO = new Date();
    SIXTY_DAYS_AGO.setDate(now.getDate() - 60);

    const last30Days = payments.filter((p) => new Date(p.date) >= THIRTY_DAYS_AGO);
    const prev30Days = payments.filter((p) =>
      new Date(p.date) < THIRTY_DAYS_AGO && new Date(p.date) >= SIXTY_DAYS_AGO
    );

    const totalNow = last30Days.reduce((acc, p) => acc + p.totalPrice, 0);
    const totalKgNow = last30Days.reduce((acc, p) => acc + p.weightKg, 0);
    const avgNow = last30Days.length > 0 ? totalNow / last30Days.length : 0;

    const totalPrev = prev30Days.reduce((acc, p) => acc + p.totalPrice, 0);
    const totalKgPrev = prev30Days.reduce((acc, p) => acc + p.weightKg, 0);
    const avgPrev = prev30Days.length > 0 ? totalPrev / prev30Days.length : 0;

    const calcGrowth = (now: number, prev: number) => {
      if (prev === 0 && now === 0) return 0;
      if (prev === 0) return 100;
      return Math.round(((now - prev) / prev) * 100);
    };

    const growth = {
      total: calcGrowth(totalNow, totalPrev),
      kg: calcGrowth(totalKgNow, totalKgPrev),
      avg: calcGrowth(avgNow, avgPrev),
    };

    return NextResponse.json({
      stats: {
        total,
        totalKg,
        avg,
        growth,
      },
      pieData,
      barData,
    });
  } catch (err) {
    console.error("Error in /api/dashboard:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
