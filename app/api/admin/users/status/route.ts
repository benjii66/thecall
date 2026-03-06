import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminSession } from "@/lib/admin-auth";

export async function POST(req: Request) {
  const session = await verifyAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { userId, status } = await req.json();

    if (!userId || !status) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { status }
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error: any) {
    console.error("Error updating user status:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
