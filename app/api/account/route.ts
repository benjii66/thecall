import { riotFetch } from "@/lib/riot";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const gameName = searchParams.get("gameName");
  const tagLine = searchParams.get("tagLine");

  if (!gameName || !tagLine) {
    return NextResponse.json(
      { error: "Missing gameName or tagLine" },
      { status: 400 }
    );
  }

  const data = await riotFetch(
    `/riot/account/v1/accounts/by-riot-id/${gameName}/${tagLine}`
  );

  return NextResponse.json(data);
}
