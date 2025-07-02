import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@/app/generated/prisma";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = Number(session?.user?.id);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");

  if (id) {
    const data = await prisma.payment.findFirst({
      where: { id: Number(id), userId },
    });
    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(data);
  }

  const data = await prisma.payment.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    include: { user: true },
  });

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = Number(session?.user?.id);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const date = form.get("date") as string;
  const coffeeType = form.get("coffeeType") as string;
  const weightKg = parseFloat(form.get("weightKg") as string);
  const totalPrice = parseInt(form.get("totalPrice") as string);
  const imageFile = form.get("image") as File;

  let fileName: string | null = null;
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  if (imageFile && imageFile.size > 0) {
    const buffer = Buffer.from(await imageFile.arrayBuffer());
    const ext = imageFile.name.split(".").pop();
    const file = `upload-${Date.now()}.${ext}`;
    const uploadPath = path.join(process.cwd(), "public/uploads", file);
    fs.writeFileSync(uploadPath, buffer);
    fileName = `${baseUrl}/uploads/${file}`;
  }

  const newPayment = await prisma.payment.create({
    data: {
      date: new Date(date),
      coffeeType,
      weightKg,
      totalPrice,
      image: fileName,
      userId,
    },
  });

  return NextResponse.json(newPayment);
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = Number(session?.user?.id);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const id = parseInt(form.get("id") as string);
  const date = form.get("date") as string;
  const coffeeType = form.get("coffeeType") as string;
  const weightKg = parseFloat(form.get("weightKg") as string);
  const totalPrice = parseInt(form.get("totalPrice") as string);
  const imageFile = form.get("image") as File;

  let fileName: string | null = null;
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  const existing = await prisma.payment.findUnique({
    where: { id, userId },
  });

  if (imageFile && imageFile.size > 0) {
    const buffer = Buffer.from(await imageFile.arrayBuffer());
    const ext = imageFile.name.split(".").pop();
    const file = `upload-${Date.now()}.${ext}`;
    const uploadPath = path.join(process.cwd(), "public/uploads", file);
    fs.writeFileSync(uploadPath, buffer);
    fileName = `${baseUrl}/uploads/${file}`;

    // 🔥 Hapus image lama jika ada
    if (existing?.image) {
      const oldPath = path.join(process.cwd(), "public", new URL(existing.image).pathname);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }
  }

  const updated = await prisma.payment.update({
    where: { id, userId },
    data: {
      date: new Date(date),
      coffeeType,
      weightKg,
      totalPrice,
      ...(fileName ? { image: fileName } : {}),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = Number(session?.user?.id);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id } = body;

  const existing = await prisma.payment.findUnique({
    where: { id: Number(id), userId },
  });

  // 🔥 Hapus image dari folder jika ada
  if (existing?.image) {
    const oldPath = path.join(process.cwd(), "public", new URL(existing.image).pathname);
    if (fs.existsSync(oldPath)) {
      fs.unlinkSync(oldPath);
    }
  }

  await prisma.payment.delete({
    where: { id: Number(id), userId },
  });

  return NextResponse.json({ success: true });
}
