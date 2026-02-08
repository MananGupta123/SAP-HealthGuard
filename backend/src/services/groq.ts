// Groq LLM Service - Integration with Groq API
import crypto from 'crypto';
import 'dotenv/config'; // Load .env file first!
import fs from 'fs';
import Groq from 'groq-sdk';
import path from 'path';

// Initialize Groq client (after dotenv loads)
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || ''
});

// Model to use
const MODEL = 'llama-3.1-8b-instant';

// Load prompts from files
const PROMPTS_DIR = path.join(__dirname, '../../prompts');

function loadPrompt(filename: string): string {
  const filepath = path.join(PROMPTS_DIR, filename);
  return fs.readFileSync(filepath, 'utf-8');
}

/**
 * Generate a hash of the prompt for audit purposes
 */
export function hashPrompt(prompt: string): string {
  return crypto.createHash('sha256').update(prompt).digest('hex').substring(0, 16);
}

/**
 * Call Groq API with a system prompt and user content
 */
async function callGroq(systemPrompt: string, userContent: string): Promise<string> {
  if (!process.env.GROQ_API_KEY) {
    console.warn('⚠️ GROQ_API_KEY not set - returning mock response');
    return JSON.stringify({
      error: 'GROQ_API_KEY not configured',
      mock: true
    });
  }

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent }
      ],
      model: MODEL,
      temperature: 0.3, // Lower temperature for more consistent JSON output
      max_tokens: 2000
    });

    return completion.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Groq API error:', error);
    throw error;
  }
}

/**
 * Parse JSON from LLM response, handling potential markdown wrapping
 */
function parseJsonResponse<T>(response: string): T {
  // Remove markdown code blocks if present
  let cleaned = response.trim();
  
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  
  cleaned = cleaned.trim();
  
  return JSON.parse(cleaned);
}

/**
 * Analyze an incident using Groq LLM
 */
export async function analyzeWithLLM(incident: {
  title: string;
  description: string;
  module: string;
  severity: string;
  month_end: boolean;
  raw_log: {
    changed_objects: string[];
    recent_deploys: string[];
  };
}): Promise<{
  classification: string;
  probable_root_causes: string[];
  relevant_logs_snippet: string[];
  tags: string[];
  prompt_hash: string;
}> {
  const systemPrompt = loadPrompt('analyze_prompt.txt');
  const userContent = JSON.stringify(incident, null, 2);
  
  const response = await callGroq(systemPrompt, userContent);
  const parsed = parseJsonResponse<{
    classification: string;
    probable_root_causes: string[];
    relevant_logs_snippet: string[];
    tags: string[];
  }>(response);
  
  return {
    ...parsed,
    prompt_hash: hashPrompt(systemPrompt)
  };
}

/**
 * Generate a playbook using Groq LLM
 */
export async function generatePlaybookWithLLM(input: {
  incident_summary: string;
  classification: string;
  module: string;
  similar_incidents: Array<{
    incident_id: string;
    resolution: string;
  }>;
}): Promise<{
  title: string;
  steps: Array<{
    step_id: string;
    action: string;
    command_or_API: string;
    expected_result: string;
    verification: string;
    rollback: string;
    escalate_required?: boolean;
  }>;
  required_permissions: string[];
  estimated_time_minutes: number;
  confidence: number;
  prompt_hash: string;
}> {
  const systemPrompt = loadPrompt('playbook_prompt.txt');
  const userContent = JSON.stringify(input, null, 2);
  
  const response = await callGroq(systemPrompt, userContent);
  const parsed = parseJsonResponse<{
    title: string;
    steps: Array<{
      step_id: string;
      action: string;
      command_or_API: string;
      expected_result: string;
      verification: string;
      rollback: string;
      escalate_required?: boolean;
    }>;
    required_permissions: string[];
    estimated_time_minutes: number;
    confidence: number;
  }>(response);
  
  return {
    ...parsed,
    prompt_hash: hashPrompt(systemPrompt)
  };
}
