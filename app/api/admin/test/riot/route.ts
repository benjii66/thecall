import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { getSafeErrorMessage, validateOrigin } from "@/lib/security";

export async function POST(req: NextRequest) {
  if (!validateOrigin(req)) return NextResponse.json({ error: "Invalid Origin" }, { status: 403 });

  try {
    const session = await verifyAdminSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { key } = await req.json();
    const apiKey = key || process.env.RIOT_API_KEY;

    if (!apiKey) return NextResponse.json({ error: "No API Key" }, { status: 400 });

    // Test with a simple status call
    const res = await fetch(`https://euw1.api.riotgames.com/lol/status/v4/platform-data?api_key=${apiKey}`);
    
    if (res.ok) {
        return NextResponse.json({ success: true });
    } else {
        const errorData = await res.json().catch(() => ({}));
        return NextResponse.json({ 
            success: false, 
            error: getSafeErrorMessage(errorData.status?.message || `Riot API Error: ${res.status}`, "Erreur API Riot") 
        });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: getSafeErrorMessage(err) });
  }
}
