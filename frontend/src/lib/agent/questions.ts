import { openai, MODELS } from '../llm';
import { SEARCH_QUERY_PROMPT, RELATED_QUESTION_PROMPT } from './prompts';

export async function generateSearchQueries(
    userQuery: string,
    prevStepsContext: string,
    currentStep: string
): Promise<string[]> {
    try {
        const response = await openai.chat.completions.create({
            model: MODELS.fast,
            messages: [
                {
                    role: 'user',
                    content: SEARCH_QUERY_PROMPT(userQuery, prevStepsContext, currentStep),
                },
            ],
            stream: false,
        });

        const text = response.choices[0].message.content || '';
        return parseList(text);
    } catch (error) {
        console.error("Error generating search queries:", error);
        return [userQuery];
    }
}

export async function generateRelatedQuestions(
    query: string,
    context: string
): Promise<string[]> {
    try {
        const response = await openai.chat.completions.create({
            model: MODELS.fast,
            messages: [
                {
                    role: 'user',
                    content: RELATED_QUESTION_PROMPT(query, context),
                },
            ],
            stream: false,
        });

        const text = response.choices[0].message.content || '';
        return parseList(text);
    } catch (error) {
        console.error("Error generating related questions:", error);
        return [];
    }
}

function parseList(text: string): string[] {
    try {
        let cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        // Sometimes models prefix with "related_questions: " or similar depending on prompt
        cleanText = cleanText.replace(/^.*: \s*/, '');

        // Try to find a JSON list
        const match = cleanText.match(/\[[\s\S]*\]/);
        if (match) {
            let jsonStr = match[0];
            try {
                const parsed = JSON.parse(jsonStr);
                if (Array.isArray(parsed)) {
                    return parsed.map(String);
                }
            } catch (e) {
                // Try replacing single quotes with double quotes
                try {
                    const fixedStr = jsonStr.replace(/'/g, '"');
                    const parsed = JSON.parse(fixedStr);
                    if (Array.isArray(parsed)) return parsed.map(String);
                } catch (e2) {
                    console.error("Failed to parse list with quote fix:", e2);
                }
            }
        }

        // Fallback?
        return [];
    } catch (e) {
        console.error("Failed to parse list:", e);
        return [];
    }
}
