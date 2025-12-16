import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/lib/stack";
import { createServerSupabaseClient } from "@/lib/supabase";
import { chatWithEntries } from "@/lib/openai";

// POST /api/chat - Chat with journal entries
export async function POST(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { message, chatHistory = [] } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    // Get all entries for context
    const { data: entries, error } = await supabase
      .from("journal_entries")
      .select("content, created_at, title, mood")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching entries:", error);
      return NextResponse.json({ error: "Failed to fetch entries" }, { status: 500 });
    }

    if (!entries || entries.length === 0) {
      return NextResponse.json({ 
        response: "I don't have any journal entries to reference yet. Start writing some entries and then we can chat about your reflections!" 
      });
    }

    // Generate response using OpenAI
    const response = await chatWithEntries(message, entries, chatHistory);

    return NextResponse.json({ response });
  } catch (error) {
    console.error("Error in POST /api/chat:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

