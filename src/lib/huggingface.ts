const HF_API = 'https://api-inference.huggingface.co/models'
const MODEL = 'mistralai/Mistral-7B-Instruct-v0.3'
const FALLBACK = 'meta-llama/Llama-3.1-8B-Instruct'

interface HFResponse {
  generated_text: string
}

interface LessonResponse {
  content: string
  flashcards: Array<{ question: string; answer: string }>
}

interface MCQQuestion {
  question: string
  options: string[]
  correct: number
}

interface Flashcard {
  question: string
  answer: string
}

async function callHF(
  prompt: string,
  maxTokens: number,
  temperature: number,
  model: string = MODEL
): Promise<string> {
  const res = await fetch(`${HF_API}/${model}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: {
        max_new_tokens: maxTokens,
        temperature,
        return_full_text: false,
      },
    }),
  })

  if (res.status === 429 && model === MODEL) {
    return callHF(prompt, maxTokens, temperature, FALLBACK)
  }

  if (!res.ok) {
    throw new Error(`HuggingFace API error: ${res.status} ${res.statusText}`)
  }

  const data = (await res.json()) as HFResponse[]
  return data[0].generated_text
}

function extractJSON<T>(text: string, arrayExpected: boolean): T {
  const pattern = arrayExpected ? /\[[\s\S]*\]/ : /\{[\s\S]*\}/
  const match = text.match(pattern)
  if (!match) throw new Error('AI returned invalid JSON structure')
  return JSON.parse(match[0]) as T
}

export async function generateLesson(topic: string, subject: string): Promise<LessonResponse> {
  const prompt = `[INST] You are a study tutor. Generate a detailed lesson for:
Topic: ${topic}
Subject: ${subject}

Return ONLY this JSON (no extra text):
{
  "content": "markdown lesson text minimum 400 words",
  "flashcards": [{"question": "...", "answer": "..."}, ...]
}
[/INST]`

  const text = await callHF(prompt, 800, 0.7)
  return extractJSON<LessonResponse>(text, false)
}

export async function generateMCQ(topic: string, subject: string): Promise<MCQQuestion[]> {
  const prompt = `[INST] Generate exactly 10 multiple choice questions for:
Topic: ${topic}, Subject: ${subject}

Return ONLY this JSON array (no extra text):
[{"question": "...", "options": ["A","B","C","D"], "correct": 0}, ...]

"correct" is the index 0-3 of the right answer.
[/INST]`

  const text = await callHF(prompt, 600, 0.3)
  return extractJSON<MCQQuestion[]>(text, true)
}

export async function chatWithTutor(
  subject: string,
  topic: string,
  history: string,
  message: string
): Promise<string> {
  const prompt = `[INST] You are a helpful study tutor for ${subject}.
Topic being studied: ${topic}

Chat history:
${history}

Student asks: ${message}

Answer clearly in 2-4 sentences. Simple language only. [/INST]`

  return callHF(prompt, 400, 0.8)
}

export async function generateFlashcards(topic: string, subject: string): Promise<Flashcard[]> {
  const prompt = `[INST] Generate 8 flashcards for studying:
Topic: ${topic}, Subject: ${subject}

Return ONLY this JSON array (no extra text):
[{"question": "...", "answer": "..."}, ...]
[/INST]`

  const text = await callHF(prompt, 400, 0.5)
  return extractJSON<Flashcard[]>(text, true)
}

export async function extractTopics(syllabus: string, subject: string): Promise<string[]> {
  const prompt = `[INST] Extract individual study topics from this course syllabus. Each topic should be a short, specific concept (2-6 words).

Subject: ${subject}
Syllabus:
${syllabus}

Return ONLY a JSON array of topic strings, maximum 15 topics:
["Topic 1", "Topic 2", ...]
[/INST]`

  const text = await callHF(prompt, 300, 0.3)
  const topics = extractJSON<string[]>(text, true)
  return topics.filter((t) => typeof t === 'string' && t.trim().length > 0).slice(0, 15)
}
