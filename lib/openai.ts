import OpenAI from 'openai';

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateJournalPrompts(yesterdayContent: string | null): Promise<string[]> {
  const systemPrompt = `You are a thoughtful, therapeutic journaling assistant. Your role is to help users reflect on their day and emotions. Be warm, gentle, and encouraging. Keep prompts concise but meaningful.`;

  const userPrompt = yesterdayContent
    ? `Based on this journal entry from yesterday, suggest 2-3 thoughtful reflection prompts for today's journaling session. The prompts should help the user continue their self-reflection journey and build on their previous thoughts.

Yesterday's entry:
"""
${yesterdayContent}
"""

Return only the prompts, one per line, without numbering or bullets.`
    : `The user is starting fresh with no previous journal entries. Suggest 2-3 gentle, open-ended prompts to help them begin their journaling journey today. Focus on present feelings, gratitude, or simple observations.

Return only the prompts, one per line, without numbering or bullets.`;

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

