import { NextRequest } from "next/server";
import { stackServerApp } from "@/lib/stack";
import { createServerSupabaseClient } from "@/lib/supabase";
import { openai } from "@/lib/openai";

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

    // Format entries with user's timezone
    const entriesContext = entries
      .map((e) => {
        const date = new Date(e.created_at).toLocaleDateString("en-US", {
          timeZone: userTimezone,
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        });
        const title = e.title ? ` - "${e.title}"` : '';
        const mood = e.mood ? ` (feeling ${e.mood})` : '';
        return `[${date}${title}${mood}]\n${e.content}`;
      })
      .join('\n\n---\n\n');

    const systemPrompt = `You are a thoughtful, empathetic AI companion who has access to the user's journal entries. Your role is to:
- Help them reflect on patterns and themes in their writing
- Provide supportive insights based on their journal history
- Answer questions about their past entries
- Offer gentle, therapeutic guidance

Be warm, understanding, and never judgmental. Reference specific entries when relevant. Keep responses concise but meaningful.

The user is in timezone: ${userTimezone}. All dates mentioned should be relative to their local time.

Here are the user's journal entries for context:

${entriesContext}`;

    const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: systemPrompt },
      ...chatHistory.map((m: { role: string; content: string }) => ({ 
        role: m.role as "user" | "assistant", 
        content: m.content 
      })),
      { role: "user", content: message },
    ];

    // Create streaming response
    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.7,
      max_tokens: 500,
      stream: true,
    });

    // Create a readable stream for the response
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content || "";
          if (text) {
            controller.enqueue(encoder.encode(text));
          }
        }
        controller.close();
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
