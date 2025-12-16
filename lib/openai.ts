import OpenAI from 'openai';

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateJournalPrompts(previousEntries: { content: string; created_at: string }[]): Promise<string[]> {
  const systemPrompt = `You are a thoughtful, therapeutic journaling assistant. Your role is to help users reflect on their day and emotions. Be warm, gentle, and encouraging. Keep prompts concise but meaningful.`;

  let userPrompt: string;
  
  if (previousEntries.length > 0) {
    const entriesSummary = previousEntries
      .slice(0, 5) // Use last 5 entries for context
      .map((e, i) => `Entry ${i + 1} (${new Date(e.created_at).toLocaleDateString()}): ${e.content.slice(0, 500)}${e.content.length > 500 ? '...' : ''}`)
      .join('\n\n');
    
    userPrompt = `Based on these recent journal entries, suggest 2-3 thoughtful reflection prompts for today's journaling session. The prompts should help the user continue their self-reflection journey, identify patterns, and build on their previous thoughts.

Recent entries:
"""
${entriesSummary}
"""

Return only the prompts, one per line, without numbering or bullets.`;
  } else {
    userPrompt = `The user is starting fresh with no previous journal entries. Suggest 2-3 gentle, open-ended prompts to help them begin their journaling journey today. Focus on present feelings, gratitude, or simple observations.

Return only the prompts, one per line, without numbering or bullets.`;
  }

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 300,
  });

  const content = response.choices[0]?.message?.content || '';
  return content.split('\n').filter((line) => line.trim().length > 0);
}

export async function generateParagraphSuggestion(
  currentParagraph: string,
  previousContent: string
): Promise<string> {
  const systemPrompt = `You are a gentle, therapeutic journaling companion. When a user finishes writing a paragraph, you provide a single, brief reflection question or gentle prompt to help them dig deeper or continue their thought process. Be warm and supportive, never judgmental. Keep your response to 1-2 sentences maximum.`;

  const userPrompt = `The user is journaling. Here's what they've written so far:

${previousContent ? `Previous content:\n"""${previousContent}"""\n\n` : ''}Current paragraph they just finished:
"""
${currentParagraph}
"""

Provide a single gentle, therapeutic follow-up question or prompt to help them continue reflecting. Keep it brief and supportive.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 100,
  });

  return response.choices[0]?.message?.content || '';
}

export async function generateEntrySummary(content: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { 
        role: 'system', 
        content: 'You summarize journal entries in a single brief sentence (10-15 words max). Focus on the main theme or emotion. Be concise and insightful.' 
      },
      { 
        role: 'user', 
        content: `Summarize this journal entry in one brief sentence:\n\n${content.slice(0, 1000)}` 
      },
    ],
    temperature: 0.5,
    max_tokens: 50,
  });

  return response.choices[0]?.message?.content || '';
}

export async function chatWithEntries(
  userMessage: string,
  entries: { content: string; created_at: string; title?: string; mood?: string }[],
  chatHistory: { role: 'user' | 'assistant'; content: string }[]
): Promise<string> {
  const entriesContext = entries
    .map((e, i) => {
      const date = new Date(e.created_at).toLocaleDateString();
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

Here are the user's journal entries for context:

${entriesContext}`;

  const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
    { role: 'system', content: systemPrompt },
    ...chatHistory.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user', content: userMessage },
  ];

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    temperature: 0.7,
    max_tokens: 500,
  });

  return response.choices[0]?.message?.content || '';
}
