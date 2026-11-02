import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

export const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const DEFAULT_MODEL = 'gemini-3.8-flash';

export interface AutoOrganizeResult {
  category: 'Work' | 'Study' | 'Research' | 'Personal' | 'Finance' | 'Technology' | 'Health' | 'Other';
  tags: string[];
  summary: string;
  keyTakeaways: string[];
}

export async function autoOrganizeMemory(title: string, content: string): Promise<AutoOrganizeResult> {
  const prompt = `Analyze this user note/document titled "${title}" and generate a clean smart organization structure.
Content:
${content.slice(0, 4000)}

Return a JSON object adhering to the schema:
- category: One of "Work", "Study", "Research", "Personal", "Finance", "Technology", "Health", "Other"
- tags: Array of 3-5 concise, lowercase keyword tags
- summary: A crisp 2-3 sentence executive summary of the content
- keyTakeaways: Array of 3 key takeaway bullet statements`;

  try {
    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: {
              type: Type.STRING,
              description: 'Primary category of the document',
            },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '3-5 descriptive lowercase tags',
            },
            summary: {
              type: Type.STRING,
              description: 'Concise 2-3 sentence executive summary',
            },
            keyTakeaways: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '3 critical takeaways or action items',
            },
          },
          required: ['category', 'tags', 'summary', 'keyTakeaways'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    const validCategories = ['Work', 'Study', 'Research', 'Personal', 'Finance', 'Technology', 'Health', 'Other'];
    const category = validCategories.includes(parsed.category) ? parsed.category : 'Personal';

    return {
      category: category as any,
      tags: Array.isArray(parsed.tags) ? parsed.tags.map((t: string) => t.toLowerCase().trim()) : ['note'],
      summary: parsed.summary || 'Summary generated from memory content.',
      keyTakeaways: Array.isArray(parsed.keyTakeaways) ? parsed.keyTakeaways : [],
    };
  } catch (err: any) {
    console.error('Error in autoOrganizeMemory:', err);
    return {
      category: 'Personal',
      tags: ['saved-item', 'memory'],
      summary: content.slice(0, 160) + (content.length > 160 ? '...' : ''),
      keyTakeaways: ['Saved to personal memory vault.'],
    };
  }
}

export interface GroundedSource {
  id: string;
  title: string;
  category: string;
  type: string;
  excerpt: string;
}

export interface ChatResponseResult {
  answer: string;
  sources: GroundedSource[];
}

export async function askMemoryVault(
  query: string,
  memories: Array<{ id: string; title: string; content: string; summary: string; category: string; type: string }>,
  history: Array<{ role: 'user' | 'assistant'; content: string }> = []
): Promise<ChatResponseResult> {
  if (!memories.length) {
    return {
      answer: "Your MindVault currently has no saved memories. Please save a note, upload a PDF, or add a link first, and I will be able to answer any questions about it!",
      sources: [],
    };
  }

  // Tokenized keyword ranking to find top matching memories
  const queryWords = query
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !['what', 'when', 'where', 'which', 'about', 'from', 'with', 'that', 'this', 'have', 'your'].includes(w));

  const scoredMemories = memories.map((m) => {
    let score = 0;
    const titleL = m.title.toLowerCase();
    const contentL = m.content.toLowerCase();
    const summaryL = (m.summary || '').toLowerCase();

    for (const word of queryWords) {
      if (titleL.includes(word)) score += 5;
      if (summaryL.includes(word)) score += 3;
      if (contentL.includes(word)) score += 1;
    }
    return { memory: m, score };
  });

  scoredMemories.sort((a, b) => b.score - a.score);

  // If query specifically asks about something completely absent and has 0 relevance
  const topMatches = scoredMemories.slice(0, 4).filter((sm) => sm.score > 0);
  const relevantMemories = topMatches.length > 0 ? topMatches.map((t) => t.memory) : memories.slice(0, 3);

  // Build the memory context
  const memoryContext = relevantMemories.map((m, idx) => `
[DOCUMENT ${idx + 1}]
ID: ${m.id}
Title: ${m.title}
Category: ${m.category}
Type: ${m.type}
Summary: ${m.summary}
Content Excerpt:
${m.content.slice(0, 1500)}
`).join('\n');

  const systemInstruction = `You are MindVault AI, an intelligent personal memory assistant.
Answer the user's question using ONLY the provided memory documents.

GROUNDING RULES:
1. Base your answer strictly on the facts present in the provided memory documents.
2. If the user's question cannot be answered from the provided memories, or if the information is unavailable, you MUST state clearly:
   "I could not find information about that in your saved memories."
   Do NOT make up or hallucinate external facts.
3. If information is present, answer clearly with bullet points and cite the document title.
4. Output JSON with "answer" and "sources" (array of { "id", "title", "category", "type", "excerpt" }).`;

  const prompt = `User Question: "${query}"

Here are the user's memory records:
${memoryContext}

Respond with JSON:
{
  "answer": "markdown string answer",
  "sources": [{ "id": "...", "title": "...", "category": "...", "type": "...", "excerpt": "..." }]
}`;

  try {
    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
      config: {
        systemInstruction,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return {
      answer: parsed.answer || "I could not find information about that in your saved memories.",
      sources: Array.isArray(parsed.sources) ? parsed.sources : [],
    };
  } catch (err: any) {
    console.error('Error in askMemoryVault:', err);
    if (topMatches.length > 0) {
      const top = topMatches[0].memory;
      return {
        answer: `Based on your saved document **${top.title}**:\n\n${top.summary || top.content.slice(0, 240)}`,
        sources: [
          {
            id: top.id,
            title: top.title,
            category: top.category,
            type: top.type,
            excerpt: top.content.slice(0, 160) + '...',
          },
        ],
      };
    }
    return {
      answer: "I could not find information about that in your saved memories.",
      sources: [],
    };
  }
}

export async function generateStudyModule(
  memories: Array<{ id: string; title: string; content: string; category: string }>,
  type: 'quiz' | 'flashcards' | 'revision'
): Promise<any> {
  const combinedContext = memories
    .map(
      (m, i) => `
[SOURCE ${i + 1}: ${m.title} (${m.category})]
${m.content.slice(0, 3000)}
`
    )
    .join('\n');

  if (type === 'quiz') {
    const prompt = `Create an interactive 5-question multiple choice quiz testing the core concepts in the following study material.
Material:
${combinedContext}

Return a JSON array of 5 questions.
Each question must have:
- "id": string (e.g. "q1")
- "question": clear question prompt
- "options": array of 4 distinct choices (strings)
- "correctIndex": integer index (0-3) of the correct choice
- "explanation": a detailed 1-2 sentence explanation of why this answer is correct and why other choices are wrong.`;

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              question: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              correctIndex: { type: Type.INTEGER },
              explanation: { type: Type.STRING },
            },
            required: ['id', 'question', 'options', 'correctIndex', 'explanation'],
          },
        },
      },
    });

    return JSON.parse(response.text || '[]');
  } else if (type === 'flashcards') {
    const prompt = `Create 6 to 8 high-impact active-recall flashcards from the following study material.
Material:
${combinedContext}

Return a JSON array of flashcards.
Each flashcard must have:
- "id": string (e.g. "card-1")
- "front": crisp, focused question, definition prompt, or concept prompt (under 20 words)
- "back": high-clarity answer, explanation, or key distinction (2-3 sentences)
- "category": the topic or document title it belongs to`;

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              front: { type: Type.STRING },
              back: { type: Type.STRING },
              category: { type: Type.STRING },
            },
            required: ['id', 'front', 'back', 'category'],
          },
        },
      },
    });

    return JSON.parse(response.text || '[]');
  } else {
    // Revision summary
    const prompt = `Create a structured revision master summary (cheat sheet) based on the following material:
${combinedContext}

Return a JSON object with:
- "title": Title of the revision summary
- "overview": 1-2 paragraph executive synthesis of the overarching themes
- "keyPoints": Array of 5-8 bulleted high-priority insights
- "importantTerms": Array of { "term": string, "definition": string }
- "studyTips": Array of 3 practical memory and application retention tips`;

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            overview: { type: Type.STRING },
            keyPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            importantTerms: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  term: { type: Type.STRING },
                  definition: { type: Type.STRING },
                },
                required: ['term', 'definition'],
              },
            },
            studyTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['title', 'overview', 'keyPoints', 'importantTerms', 'studyTips'],
        },
      },
    });

    return JSON.parse(response.text || '{}');
  }
}
