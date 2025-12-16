import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/lib/stack";
import { generateParagraphSuggestion } from "@/lib/gemini";

// POST /api/suggestions - Get AI suggestion for the current paragraph
export async function POST(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { currentParagraph, previousContent } = body;

    if (!currentParagraph || typeof currentParagraph !== "string") {
      return NextResponse.json({ error: "Current paragraph is required" }, { status: 400 });
    }

    // Generate suggestion using Gemini
    const suggestion = await generateParagraphSuggestion(
      currentParagraph,
      previousContent || ""
    );

    return NextResponse.json({ suggestion });
  } catch (error) {
    console.error("Error in POST /api/suggestions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
