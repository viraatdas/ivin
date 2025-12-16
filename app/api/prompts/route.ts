import { NextResponse } from "next/server";
import { stackServerApp } from "@/lib/stack";
import { createServerSupabaseClient } from "@/lib/supabase";
import { generateJournalPrompts } from "@/lib/openai";

// GET /api/prompts - Get AI-generated prompts based on all previous entries
export async function GET() {
  try {
    const user = await stackServerApp.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServerSupabaseClient();

    // Get the last 10 entries for context
    const { data: entries } = await supabase
      .from("journal_entries")
      .select("content, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    // Generate prompts using OpenAI with all entries as context
    const prompts = await generateJournalPrompts(entries || []);

    return NextResponse.json({ prompts });
  } catch (error) {
    console.error("Error in GET /api/prompts:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
