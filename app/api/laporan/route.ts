import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@/app/generated/prisma";

const prisma = new PrismaClient();

export async function GET(req : NextRequest) {
    const session = await getServerSession(authOptions);
  const userId = session?.user?.["id"];
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const searchParams = req.nextUrl.searchParams;
  const id = searchParams.get("id");

  // ✅ Jika ada parameter `id`, ambil 1 data saja (untuk edit)
  if (id) {
    const data = await prisma.payment.findFirst({
      where: { id: Number(id), userId: Number(userId) },
    });

    if (!data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  }

  // ✅ Jika tidak ada parameter, ambil semua data (untuk list)
  const data = await prisma.payment.findMany({
    where: { userId: Number(userId) },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.["id"];
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { date, coffeeType, weightKg, totalPrice } = body;

  const newPayment = await prisma.payment.create({
    data: {
      date: new Date(date),
      coffeeType,
      weightKg: parseFloat(weightKg),
      totalPrice: parseInt(totalPrice),
      userId: Number(userId),
    },
  });

  return NextResponse.json(newPayment);
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.["id"];
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, date, coffeeType, weightKg, totalPrice } = body;

  const updated = await prisma.payment.update({
    where: { id: Number(id), userId: Number(userId) },
    data: {
      date: new Date(date),
      coffeeType,
      weightKg: parseFloat(weightKg),
      totalPrice: parseInt(totalPrice),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.["id"];
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id } = body;

  await prisma.payment.delete({
    where: { id: Number(id), userId: Number(userId) },
  });

  return NextResponse.json({ success: true });
}
