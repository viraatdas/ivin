import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

export async function generateJournalPrompts(previousEntries: { content: string; created_at: string; title?: string; mood?: string }[]): Promise<string[]> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

  let prompt: string;
  
  if (previousEntries.length > 0) {
    const entriesSummary = previousEntries
      .slice(0, 2)
      .map((e, i) => {
        const date = new Date(e.created_at).toLocaleDateString("en-US", {
          weekday: "long",
          month: "long", 
          day: "numeric",
          year: "numeric"
        });
        const title = e.title ? `"${e.title}"` : 'Untitled';
        const mood = e.mood ? ` (mood: ${e.mood})` : '';
        // Include more content - up to 1500 chars to get real specifics
        return `Entry ${i + 1}: ${title} - ${date}${mood}\n${e.content.slice(0, 1500)}${e.content.length > 1500 ? '...' : ''}`;
      })
      .join('\n\n---\n\n');
    
    prompt = `You are a thoughtful, therapeutic journaling assistant helping someone continue their journaling practice.

Here are their last ${previousEntries.length} journal ${previousEntries.length === 1 ? 'entry' : 'entries'}:

${entriesSummary}

Generate 2-3 personalized reflection prompts for today. IMPORTANT:
- Reference SPECIFIC things they mentioned (names, events, feelings, situations, goals, relationships)
- Ask follow-up questions about unresolved thoughts or emotions from their entries
- Help them explore patterns or continue threads from what they wrote
- Be warm and curious, not generic

Examples of good specific prompts:
- "You mentioned feeling conflicted about [specific thing]. How has that been sitting with you?"
- "Last time you wrote about [person/situation]. Any new thoughts on that?"
- "You seemed to be working through [specific emotion/decision]. Where are you with that now?"

Return only the prompts, one per line, without numbering or bullets. Make each prompt specific to THEIR journal content.`;
  } else {
    prompt = `You are a thoughtful, therapeutic journaling assistant. The user is starting fresh with no previous journal entries. Suggest 2-3 gentle, open-ended prompts to help them begin their journaling journey today. Focus on present feelings, gratitude, or simple observations.

Return only the prompts, one per line, without numbering or bullets.`;
  }

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  
  return text.split('\n').filter((line) => line.trim().length > 0);
}

export async function generateParagraphSuggestion(
  currentParagraph: string,
  previousContent: string
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

  const prompt = `You are a gentle, therapeutic journaling companion. When a user finishes writing a paragraph, you provide a single, brief reflection question or gentle prompt to help them dig deeper or continue their thought process. Be warm and supportive, never judgmental. Keep your response to 1-2 sentences maximum.

The user is journaling. Here's what they've written so far:

${previousContent ? `Previous content:\n"""${previousContent}"""\n\n` : ''}Current paragraph they just finished:
"""
${currentParagraph}
"""

Provide a single gentle, therapeutic follow-up question or prompt to help them continue reflecting. Keep it brief and supportive.`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

export async function generateEntrySummary(content: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

  const prompt = `Summarize this journal entry in a single brief sentence (10-15 words max). Focus on the main theme or emotion. Be concise and insightful.

Journal entry:
${content.slice(0, 1000)}`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text().trim();
}

export async function generateChatTitle(messages: { role: string; content: string }[]): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

  const conversation = messages
    .slice(0, 6) // Use first few messages to get the gist
    .map((m) => `${m.role === "user" ? "User" : "AI"}: ${m.content.slice(0, 300)}`)
    .join("\n");

  const prompt = `Generate a short, descriptive title (3-6 words) for this journal chat conversation. The title should capture the main topic or theme discussed. Be specific, not generic.

Examples of good titles:
- "Reflecting on Career Doubts"
- "Processing the Breakup"
- "Finding Peace with Family"
- "Exploring Creative Block"

Conversation:
${conversation}

Return ONLY the title, nothing else. No quotes, no punctuation at the end.`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text().trim().replace(/^["']|["']$/g, ''); // Remove any quotes
}

export async function chatWithEntriesStream(
  userMessage: string,
  entries: { content: string; created_at: string; title?: string; mood?: string }[],
  chatHistory: { role: 'user' | 'assistant'; content: string }[],
  userTimezone: string
): Promise<AsyncIterable<string>> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

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

  const historyForGemini = chatHistory.map(m => ({
    role: m.role === 'user' ? 'user' as const : 'model' as const,
    parts: [{ text: m.content }],
  }));

  const chat = model.startChat({
    history: [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: 'I understand. I\'m ready to help you reflect on your journal entries.' }] },
      ...historyForGemini,
    ],
  });

  const result = await chat.sendMessageStream(userMessage);
  
  return (async function* () {
    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        yield text;
      }
    }
  })();
}


