import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
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
            error: errorData.status?.message || `Riot API Error: ${res.status}` 
        });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message });
  }
}
