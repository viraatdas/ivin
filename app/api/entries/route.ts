import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/lib/stack";
import { createServerSupabaseClient } from "@/lib/supabase";
import { generateEntrySummary } from "@/lib/gemini";

// GET /api/entries - Get all entries for the current user
export async function GET(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const { data: entries, error } = await supabase
      .from("journal_entries")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching entries:", error);
      return NextResponse.json({ error: "Failed to fetch entries" }, { status: 500 });
    }

    return NextResponse.json({ entries });
  } catch (error) {
    console.error("Error in GET /api/entries:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/entries - Create a new entry
export async function POST(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, mood } = body;

    if (!content || typeof content !== "string") {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    // Generate summary for the entry
    let summary = null;
    try {
      summary = await generateEntrySummary(content);
    } catch (e) {
      console.error("Failed to generate summary:", e);
    }

    const supabase = createServerSupabaseClient();

    const { data: entry, error } = await supabase
      .from("journal_entries")
      .insert({
        user_id: user.id,
        title: title || null,
        content,
        mood: mood || null,
        summary,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating entry:", error);
      return NextResponse.json({ error: "Failed to create entry" }, { status: 500 });
    }

    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/entries:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/entries - Update an entry
export async function PUT(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, title, content, mood } = body;

    if (!id) {
      return NextResponse.json({ error: "Entry ID is required" }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    // First verify the entry belongs to the user
    const { data: existingEntry, error: fetchError } = await supabase
      .from("journal_entries")
      .select("id, content")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !existingEntry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    // Regenerate summary if content changed
    let summary = undefined;
    if (content && content !== existingEntry.content) {
      try {
        summary = await generateEntrySummary(content);
      } catch (e) {
        console.error("Failed to generate summary:", e);
      }
    }

    const { data: entry, error } = await supabase
      .from("journal_entries")
      .update({
        title: title || null,
        content,
        mood: mood || null,
        ...(summary !== undefined && { summary }),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating entry:", error);
      return NextResponse.json({ error: "Failed to update entry" }, { status: 500 });
    }

    return NextResponse.json({ entry });
  } catch (error) {
    console.error("Error in PUT /api/entries:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/entries - Delete an entry
export async function DELETE(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Entry ID is required" }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    const { error } = await supabase
      .from("journal_entries")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting entry:", error);
      return NextResponse.json({ error: "Failed to delete entry" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/entries:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
