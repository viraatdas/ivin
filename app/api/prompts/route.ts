import { NextResponse } from "next/server";
import { stackServerApp } from "@/lib/stack";
import { createServerSupabaseClient } from "@/lib/supabase";
import { generateJournalPrompts } from "@/lib/openai";

// GET /api/prompts - Get AI-generated prompts based on yesterday's entry
export async function GET() {
  try {
    const user = await stackServerApp.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServerSupabaseClient();

    // Get yesterday's date range
    const now = new Date();
    const yesterdayStart = new Date(now);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    yesterdayStart.setHours(0, 0, 0, 0);
    
    const yesterdayEnd = new Date(now);
    yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);
    yesterdayEnd.setHours(23, 59, 59, 999);

    // Try to get yesterday's entry first
    let { data: entries } = await supabase
      .from("journal_entries")
      .select("content")
      .eq("user_id", user.id)
      .gte("created_at", yesterdayStart.toISOString())
      .lte("created_at", yesterdayEnd.toISOString())
      .order("created_at", { ascending: false })
      .limit(1);

    // If no entry yesterday, get the most recent entry
    if (!entries || entries.length === 0) {
      const { data: recentEntries } = await supabase
        .from("journal_entries")
        .select("content")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);
      
      entries = recentEntries;
    }

    const yesterdayContent = entries && entries.length > 0 ? entries[0].content : null;

    // Generate prompts using OpenAI
    const prompts = await generateJournalPrompts(yesterdayContent);

    return NextResponse.json({ prompts });
  } catch (error) {
    console.error("Error in GET /api/prompts:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

