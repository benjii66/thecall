import { NextRequest, NextResponse } from "next/server";
import { createAdminSession } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    const expectedUser = process.env.ADMIN_USER;
    const expectedPass = process.env.ADMIN_PASS;

    if (!expectedUser || !expectedPass) {
      return NextResponse.json(
        { error: "Configuration admin manquante sur le serveur" },
        { status: 500 }
      );
    }

    if (username === expectedUser && password === expectedPass) {
      await createAdminSession(username);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Identifiants invalides" },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Erreur interne" },
      { status: 500 }
    );
  }
}
