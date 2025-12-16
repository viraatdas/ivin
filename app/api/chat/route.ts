import { NextRequest } from "next/server";
import { stackServerApp } from "@/lib/stack";
import { createServerSupabaseClient } from "@/lib/supabase";
import { chatWithEntriesStream } from "@/lib/gemini";

// POST /api/chat - Chat with journal entries (streaming)
export async function POST(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser();
    
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { 
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    const body = await request.json();
    const { message, chatHistory = [], userTimezone = "UTC" } = body;

    if (!message || typeof message !== "string") {
      return new Response(JSON.stringify({ error: "Message is required" }), { 
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
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
      return new Response(JSON.stringify({ error: "Failed to fetch entries" }), { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (!entries || entries.length === 0) {
      return new Response(JSON.stringify({ 
        response: "I don't have any journal entries to reference yet. Start writing some entries and then we can chat about your reflections!" 
      }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // Create streaming response using Gemini
    const stream = await chatWithEntriesStream(message, entries, chatHistory, userTimezone);

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const text of stream) {
            controller.enqueue(encoder.encode(text));
          }
          controller.close();
        } catch (e) {
          console.error("Stream error:", e);
          controller.error(e);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("Error in POST /api/chat:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
