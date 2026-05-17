import Groq from 'groq-sdk';
import { type Company, type Activity } from '../app/components/admin/CompanyCard';

const apiKey = import.meta.env.VITE_GROQ_API_KEY;

const groq = new Groq({
  apiKey: apiKey || '',
  dangerouslyAllowBrowser: true,
});

export async function generateProfessionalSummary(companyData: Company, activities: Activity[]) {
  if (!apiKey || apiKey === 'your_groq_api_key') {
    throw new Error('Groq API key is invalid or missing. Please update your .env file with a valid API key.');
  }

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
    const chatCompletion = await groq.chat.completions.create({
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
