import Groq from 'groq-sdk';
import { type Company, type Activity } from '../app/components/admin/CompanyCard';

const apiKey = import.meta.env.VITE_GROQ_API_KEY;

export const groq = new Groq({
  apiKey: apiKey || '',
  dangerouslyAllowBrowser: true,
});

export const FALLBACK_MODELS = [
  'llama-3.3-70b-versatile',
  'qwen/qwen3.8-27b',
  'qwen/qwen3.6-27b',
  'groq/compound-mini',
  'groq/compound',
  'llama-3.1-70b-versatile',
  'llama-3.1-8b-instant',
  'allam-2-7b'
];

let cachedWorkingModel: string | null = null;

/**
 * Creates a chat completion using Groq with automatic model fallback.
 * If the requested or default model returns 404/400 (e.g. model not found or decommissioned),
 * it seamlessly tries available models without failing.
 */
export async function createGroqChatCompletion(
  params: Omit<Groq.Chat.Completions.CompletionCreateParamsNonStreaming, 'model'> & { model?: string }
) {
  if (!apiKey || apiKey === 'your_groq_api_key') {
    throw new Error('Groq API key is invalid or missing. Please update your .env file with a valid API key.');
  }

  const modelCandidates: string[] = [];

  if (cachedWorkingModel) {
    modelCandidates.push(cachedWorkingModel);
  }

  if (params.model && !modelCandidates.includes(params.model)) {
    modelCandidates.push(params.model);
  }

  // Fetch available models from Groq dynamically if possible
  try {
    const listRes = await groq.models.list();
    if (listRes?.data?.length) {
      const activeIds = listRes.data
        .map((m) => m.id)
        .filter(
          (id) =>
            !id.includes('whisper') &&
            !id.includes('guard') &&
            !id.includes('orpheus') &&
            !id.includes('safeguard')
        );
      for (const id of activeIds) {
        if (!modelCandidates.includes(id)) {
          modelCandidates.push(id);
        }
      }
    }
  } catch (err) {
    console.warn('Could not list Groq models dynamically, falling back to static list:', err);
  }

  // Ensure standard fallbacks are included
  for (const m of FALLBACK_MODELS) {
    if (!modelCandidates.includes(m)) {
      modelCandidates.push(m);
    }
  }

  let lastError: any = null;

  for (const model of modelCandidates) {
    try {
      const completion = await groq.chat.completions.create({
        ...params,
        model,
      });
      cachedWorkingModel = model;
      return completion;
    } catch (error: any) {
      lastError = error;
      console.warn(`Groq model "${model}" failed (${error?.message || error}), attempting fallback model...`);
      if (error?.status === 401) {
        throw new Error('Groq authentication failed. Please check your VITE_GROQ_API_KEY in the environment settings.');
      }
    }
  }

  throw lastError || new Error('The AI analysis service is temporarily unavailable. Please try again later.');
}

export async function generateProfessionalSummary(companyData: Company, activities: Activity[]) {
  if (!companyData) {
    throw new Error('No company data provided for analysis.');
  }

  const prompt = `
SYSTEM PROMPT:
You are an expert career operations and talent acquisition analyst. 
Generate a high-level executive summary of the current engagement with the following company.

STRICT GUIDELINES:
- Use formal, professional business language.
- Do not invent data; use only the provided context.
- Summarize historical activities into a coherent narrative.
- Identify potential blockers if any are mentioned in the logs.

OUTPUT STRUCTURE:
1. Executive Summary
2. Strategic Timeline (based on activities)
3. Open Opportunities (Roles & Descriptions)
4. Critical Next Steps

INPUT DATA:
Company: ${companyData.company_name}
Current Stage: ${companyData.stage}
Priority Level: ${companyData.priority}
Open Roles: ${JSON.stringify(companyData.positions || [])}
Engagement History: ${JSON.stringify(activities)}
`;

  try {
    const chatCompletion = await createGroqChatCompletion({
      messages: [
        {
          role: 'system',
          content: 'You are a professional career operations analyst. Your output must be formal and structured.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.5,
      max_tokens: 1024,
    });

    return chatCompletion.choices[0]?.message?.content || 'Analysis could not be generated at this time.';
  } catch (error: any) {
    console.error('Groq AI Error:', error);
    if (error?.status === 401) {
      throw new Error('Groq authentication failed. Please check your VITE_GROQ_API_KEY in the environment settings.');
    }
    throw new Error(error.message || 'The AI analysis service is temporarily unavailable. Please try again later.');
  }
}

