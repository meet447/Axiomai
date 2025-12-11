import { openai, MODELS } from '../llm';
import { QUERY_PLAN_PROMPT } from './prompts';

export interface PlanStep {
    id: number;
    step: string;
    dependencies: number[];
}

export async function generatePlan(query: string): Promise<PlanStep[]> {
    try {
        const response = await openai.chat.completions.create({
            model: MODELS.fast,
            messages: [{ role: 'user', content: QUERY_PLAN_PROMPT(query) }],
            stream: false,
        });

        const text = response.choices[0].message.content || '';
        return parsePlan(text);
    } catch (error) {
        console.error("Error generating plan:", error);
        return [];
    }
}

function parsePlan(text: string): PlanStep[] {
    try {
        // Clean up markdown code blocks if present
        let cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

        // Remove prefix if exists
        if (cleanText.startsWith('query_plan: ')) {
            cleanText = cleanText.replace('query_plan: ', '');
        }

        const parsed = JSON.parse(cleanText);
        if (Array.isArray(parsed)) {
            return parsed as PlanStep[];
        }
        return [];
    } catch (e) {
        console.error("Failed to parse plan JSON:", e);
        // Fallback: try to find array in text
        const match = text.match(/\[.*\]/s);
        if (match) {
            try {
                return JSON.parse(match[0]);
            } catch (e2) {
                return [];
            }
        }
        return [];
    }
}
