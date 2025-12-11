import OpenAI from 'openai';

// Dynamic configuration from environment variables
const BASE_URL = process.env.LLM_BASE_URL || 'https://api.openai.com/v1';
const API_KEY = process.env.LLM_API_KEY;

if (!API_KEY) {
  console.warn("LLM_API_KEY is not set in environment variables.");
}

export const openai = new OpenAI({
  baseURL: BASE_URL,
  apiKey: API_KEY,
});

// Model mapping
export const MODELS = {
  fast: process.env.MODEL_FAST || 'gpt-3.5-turbo',
  powerful: process.env.MODEL_POWERFUL || 'gpt-4',
  hyper: process.env.MODEL_HYPER || 'gpt-3.5-turbo',
};
