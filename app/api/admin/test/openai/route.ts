import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  try {
    const session = await verifyAdminSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { key } = await req.json();
    const apiKey = key || process.env.OPENAI_API_KEY;

    if (!apiKey) return NextResponse.json({ error: "No API Key" }, { status: 400 });

    // Test with a simple models list call
    const res = await fetch("https://api.openai.com/v1/models", {
        headers: {
            "Authorization": `Bearer ${apiKey}`
        }
    });

    if (res.ok) {
        return NextResponse.json({ success: true });
    } else {
        const errorData = await res.json().catch(() => ({}));
        return NextResponse.json({ 
            success: false, 
            error: errorData.error?.message || `OpenAI API Error: ${res.status}` 
        });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message });
  }
}
