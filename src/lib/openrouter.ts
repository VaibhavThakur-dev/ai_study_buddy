const BASE_URL = 'https://openrouter.ai/api/v1/chat/completions'

// Per-model timeout — skip to next model if no response within this time
const MODEL_TIMEOUT_MS = 25_000

// ── Task-specific model lists (all 100% FREE on OpenRouter) ─────────
// Source: openrouter.ai/models?free=true  — verified June 2025
//
// JSON tasks (lesson / MCQ / flashcards / topic extraction):
// Need strong instruction-following + valid structured JSON output
const JSON_MODELS = [
  'meta-llama/llama-3.3-70b-instruct:free',  // #1 — Llama 3.3 70B, best JSON + instructions
  'openai/gpt-oss-120b:free',                // #2 — OpenAI open-source 120B, GPT quality free
  'nvidia/nemotron-3-super-120b-a12b:free',  // #3 — 876B tokens/week, very powerful
  'google/gemma-4-31b-it:free',              // #4 — Reliable fallback
]

// Chat tutor: needs natural conversation + reasoning
const CHAT_MODELS = [
  'meta-llama/llama-3.3-70b-instruct:free',  // #1 — Best conversational quality
  'moonshotai/kimi-k2.6:free',               // #2 — Strong reasoning
  'openai/gpt-oss-120b:free',                // #3 — OpenAI OSS quality
  'nvidia/nemotron-3-super-120b-a12b:free',  // #4 — Powerful fallback
]

interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface OpenRouterResponse {
  choices: Array<{ message: { content: string } }>
  error?: { message: string }
}

async function callAI(
  messages: Message[],
  maxTokens: number = 800,
  temperature: number = 0.7,
  models: string[] = JSON_MODELS
): Promise<string> {
  let lastError = 'No models available'

  for (const model of models) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), MODEL_TIMEOUT_MS)

    try {
      const res = await fetch(BASE_URL, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXTAUTH_URL ?? 'http://localhost:3000',
          'X-Title': 'AI Study Buddy',
        },
        body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature }),
      })

      clearTimeout(timer)
      const raw = await res.text()

      if (!res.ok) {
        lastError = `${model} → ${res.status}: ${raw.slice(0, 120)}`
        continue // try next model
      }

      let data: OpenRouterResponse
      try {
        data = JSON.parse(raw) as OpenRouterResponse
      } catch {
        lastError = `${model} → non-JSON response`
        continue
      }

      if (data.error) {
        lastError = `${model} → ${data.error.message}`
        continue
      }

      const content = data.choices?.[0]?.message?.content
      if (!content) {
        lastError = `${model} → empty content`
        continue
      }

      return content.trim() // success — stop here
    } catch (err) {
      clearTimeout(timer)
      lastError = `${model} → ${err instanceof Error ? err.message : 'network error'}`
      continue
    }
  }

  throw new Error(`All AI models failed. Last error: ${lastError}`)
}

/* ── Depth-aware JSON extractor ─────────────────────────────────────
   Uses bracket-depth tracking so nested arrays like "options":[...]
   never confuse the outer array boundary.

   For arrays:  finds the matching ] for the first [
                If truncated, salvages all complete {...} elements
   For objects: finds the matching } for the FIRST { followed by a "
                (skips math expressions like {c_1b_2 - c_2b_1})
─────────────────────────────────────────────────────────────────── */
function findJsonStart(text: string, isArray: boolean): number {
  const openCh = isArray ? '[' : '{'
  let pos = 0
  while (pos < text.length) {
    const idx = text.indexOf(openCh, pos)
    if (idx === -1) return -1
    if (isArray) return idx
    // For objects: require first non-whitespace char after { to be " (a JSON key)
    // This skips math expressions like {c_1b_2 - c_2b_1}
    let next = idx + 1
    while (next < text.length && /\s/.test(text[next])) next++
    if (text[next] === '"') return idx
    pos = idx + 1
  }
  return -1
}

function extractStructure(text: string, isArray: boolean): string {
  const start = findJsonStart(text, isArray)
  if (start === -1) return ''

  let depth = 0
  let inString = false
  let escape = false
  let lastElementEnd = -1 // last position of a complete top-level element (arrays only)

  for (let i = start; i < text.length; i++) {
    const ch = text[i]

    if (escape)              { escape = false; continue }
    if (ch === '\\' && inString) { escape = true; continue }
    if (ch === '"')          { inString = !inString; continue }
    if (inString)            continue

    if (ch === '[' || ch === '{') depth++
    if (ch === ']' || ch === '}') {
      depth--
      // Track the end of each completed top-level object inside the array
      if (isArray && ch === '}' && depth === 1) lastElementEnd = i
      // Complete structure found
      if (depth === 0) return text.slice(start, i + 1)
    }
  }

  // Array is truncated — salvage complete elements
  if (isArray && lastElementEnd !== -1) return text.slice(start, lastElementEnd + 1) + ']'

  // Object is truncated — close all open brackets so we get partial but parseable JSON
  if (!isArray && depth > 0) {
    let salvage = text.slice(start)

    // If we ended mid-string, strip the incomplete string
    if (inString) {
      const lastQuote = salvage.lastIndexOf('"')
      if (lastQuote > 0) salvage = salvage.slice(0, lastQuote)
    }

    // Strip a trailing incomplete key (e.g. ,"keyName": or ,"keyName")
    salvage = salvage.replace(/,?\s*"[^"]*"\s*:\s*$/, '')
    salvage = salvage.replace(/,?\s*"[^"]*"\s*$/, '')

    // Re-count open brackets in salvaged text and close them
    const closers: string[] = []
    let inS = false, esc = false
    for (const ch of salvage) {
      if (esc)              { esc = false; continue }
      if (ch === '\\' && inS) { esc = true; continue }
      if (ch === '"')       { inS = !inS; continue }
      if (inS)              continue
      if (ch === '{' || ch === '[') closers.push(ch === '{' ? '}' : ']')
      if (ch === '}' || ch === ']') closers.pop()
    }
    return salvage + closers.reverse().join('')
  }

  return ''
}

/* ── Robust JSON parser ──────────────────────────────────────────── */
function parseJSON<T>(text: string, isArray: boolean): T {
  // 1. Strip markdown code fences
  const stripped = text
    .replace(/```(?:json|javascript|js)?\s*/gi, '')
    .replace(/```/g, '')
    .trim()

  // 2. Extract the correct outermost structure using depth tracking
  const candidate = extractStructure(stripped, isArray)
  if (!candidate) {
    throw new Error(`AI returned no JSON. Response: "${stripped.slice(0, 150)}"`)
  }

  // 3. Direct parse
  try {
    return JSON.parse(candidate) as T
  } catch { /* fall through to repair */ }

  // 4. Common LLM repairs
  const repaired = candidate
    .replace(/,\s*[.…]{1,3}\s*(?=[}\]])/g, '')            // ", ..." or ", …" fake elements
    .replace(/,\s*([}\]])/g, '$1')                         // trailing commas
    .replace(/:\s*'([^']*)'/g, ': "$1"')                   // single-quoted values
    .replace(/([{,]\s*)([a-zA-Z_]\w*)\s*:/g, '$1"$2":')   // unquoted keys

  try {
    return JSON.parse(repaired) as T
  } catch (err) {
    throw new Error(
      `JSON parse failed: ${err instanceof Error ? err.message : 'unknown'}` +
      ` | Raw: "${candidate.slice(0, 200)}"`
    )
  }
}

// Returns a grade-level instruction string for AI prompts
function gradeContext(grade?: number | null): string {
  if (!grade) return ''
  if (grade <= 5)  return `The student is in Class ${grade} (age ~${grade + 5}). Use very simple language, basic concepts only, short sentences, fun real-life examples. Avoid complex formulas.`
  if (grade <= 8)  return `The student is in Class ${grade} (age ~${grade + 5}). Use clear and simple language, NCERT-level concepts, basic formulas with explanation, relatable examples.`
  if (grade <= 10) return `The student is in Class ${grade} preparing for board exams. Use standard NCERT language, include important formulas, step-by-step solutions, exam-focused examples.`
  return `The student is in Class ${grade} (senior secondary). Use advanced concepts, detailed derivations, board exam level content, rigorous explanations.`
}

export interface LessonResult {
  content: string
  flashcards: Array<{ question: string; answer: string }>
}

export interface MCQQuestion {
  question: string
  options: string[]
  correct: number
}

/* ── MCQ Normalizer ─────────────────────────────────────────────────
   Different models use different field names. This normalizes them all
   into the standard { question, options: string[], correct: number }.
─────────────────────────────────────────────────────────────────── */
function normalizeMCQ(raw: unknown): MCQQuestion[] {
  if (!Array.isArray(raw)) throw new Error('MCQ response is not a JSON array')

  const results: MCQQuestion[] = []

  for (let idx = 0; idx < raw.length; idx++) {
    const item = raw[idx]
    // Skip non-objects (can appear in truncated/repaired arrays)
    if (typeof item !== 'object' || item === null) continue
    const q = item as Record<string, unknown>

    // ── Question text ──────────────────────────────────────────────
    const questionText = String(q.question ?? q.text ?? q.stem ?? q.q ?? `Question ${idx + 1}`)

    // ── Options array ──────────────────────────────────────────────
    const rawOpts = q.options ?? q.choices ?? q.answers ?? q.opts ?? q.alternatives
    let options: string[] = []

    if (Array.isArray(rawOpts)) {
      // Standard array format: ["opt1", "opt2", "opt3", "opt4"]
      options = rawOpts.map((opt: unknown) => {
        if (typeof opt === 'string') return opt.replace(/^[A-Da-d1-4][.)]\s*/, '').trim()
        if (typeof opt === 'object' && opt !== null) {
          const o = opt as Record<string, unknown>
          return String(o.text ?? o.value ?? o.option ?? o.content ?? JSON.stringify(opt))
        }
        return String(opt)
      })
    } else if (typeof rawOpts === 'object' && rawOpts !== null) {
      // Object format: {"A": "opt1", "B": "opt2", "C": "opt3", "D": "opt4"}
      options = Object.values(rawOpts as Record<string, unknown>).map(String)
    } else if (typeof q.a === 'string' || typeof q.A === 'string') {
      // Flat key format: { a: "opt1", b: "opt2", c: "opt3", d: "opt4" }
      const flat = ['a','b','c','d'].map((k) => q[k] ?? q[k.toUpperCase()])
      if (flat.some(Boolean)) options = flat.filter(Boolean).map(String)
    }

    // Skip questions with too few options — but log what we got for debugging
    if (options.length < 2) {
      continue
    }

    // ── Correct index ──────────────────────────────────────────────
    const rawCorrect = q.correct ?? q.answer ?? q.correctAnswer ?? q.correct_answer ?? q.correctIndex ?? q.correctOption ?? 0
    let correct = 0

    if (typeof rawCorrect === 'number') {
      correct = rawCorrect
    } else if (typeof rawCorrect === 'string') {
      const letter = rawCorrect.toUpperCase().trim().replace(/[.)]/g, '')
      const letterIdx = ['A', 'B', 'C', 'D'].indexOf(letter)
      correct = letterIdx !== -1 ? letterIdx : Math.max(0, parseInt(rawCorrect) || 0)
    }

    correct = Math.min(Math.max(0, correct), options.length - 1)
    results.push({ question: questionText, options, correct })
  }

  if (results.length === 0) {
    const sample = raw.length > 0 ? JSON.stringify(raw[0]).slice(0, 300) : 'empty array'
    throw new Error(`AI returned no valid questions. First item format: ${sample}`)
  }
  return results
}

export async function generateLesson(topic: string, subject: string, grade?: number | null): Promise<LessonResult> {
  const levelNote = gradeContext(grade)
  const text = await callAI(
    [
      {
        role: 'system',
        content:
          'You are an expert study tutor. You MUST return ONLY a raw JSON object. No markdown, no code fences, no explanation. Just the JSON.',
      },
      {
        role: 'user',
        content: `Write a full lesson on Topic: "${topic}" for Subject: "${subject}".
${levelNote ? `\nStudent level: ${levelNote}\n` : ''}
Rules:
- Return ONLY valid JSON — no extra text before or after
- The "content" field must be real markdown text (minimum 200 words) — NOT a placeholder, NOT "...", NOT "…"
- Difficulty and language MUST match the student's class level above
- Include ## headings, bullet points, key formulas with LaTeX ($formula$), and a worked example
- The "flashcards" array must have exactly 5 real question-answer pairs appropriate for this class level

JSON format:
{"content":"## Introduction\\n\\nWrite the full lesson here with real content...","flashcards":[{"question":"What is ...?","answer":"It is ..."},{"question":"Define ...","answer":"..."},{"question":"How do you ...?","answer":"..."},{"question":"What happens when ...?","answer":"..."},{"question":"Give an example of ...","answer":"..."}]}`,
      },
    ],
    2500,
    0.7,
    JSON_MODELS
  )
  const result = parseJSON<LessonResult>(text, false)

  // Reject placeholder responses — content must be real text
  const meaningful = result.content?.replace(/[.\s…\n]/g, '') ?? ''
  if (meaningful.length < 80) {
    throw new Error('AI returned placeholder content. Please try again.')
  }

  return result
}

/* ── Text-format MCQ parser ─────────────────────────────────────────
   Fallback for models that ignore JSON instructions and return:
   "1. Question?\nA) opt\nB) opt\nC) opt\nD) opt\nAnswer: B\n\n2. ..."
─────────────────────────────────────────────────────────────────── */
function parseTextMCQ(text: string): MCQQuestion[] {
  const results: MCQQuestion[] = []

  // Split on question boundaries: "1." / "Q1." / "Question 1:"
  const blocks = text.split(/\n\s*(?=\d{1,2}[.)]\s|\bQ\d+[.):\s]|\bQuestion\s*\d+[.):\s])/i)

  for (const block of blocks) {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean)
    if (lines.length < 3) continue

    // Question = first line, strip leading number
    const questionText = lines[0].replace(/^\d{1,2}[.)]\s*|^Q\d+[.):\s]*|^Question\s*\d+[.):\s]*/i, '').trim()
    if (!questionText) continue

    // Options = lines starting with A) B) C) D) or A. B. C. D.
    const optLines = lines.filter((l) => /^[A-Da-d][.)]\s/.test(l))
    const options = optLines.map((l) => l.replace(/^[A-Da-d][.)]\s*/i, '').trim())
    if (options.length < 2) continue

    // Correct answer = line containing "Answer:", "Correct:", "Ans:"
    let correct = 0
    const answerLine = lines.find((l) => /^(answer|correct|ans)[:\s]/i.test(l))
    if (answerLine) {
      const match = answerLine.match(/[A-Da-d]/i)
      if (match) {
        const idx = ['a', 'b', 'c', 'd'].indexOf(match[0].toLowerCase())
        correct = idx !== -1 ? idx : 0
      }
    }
    correct = Math.min(correct, options.length - 1)
    results.push({ question: questionText, options, correct })
  }

  return results
}

export async function generateMCQ(
  topic: string,
  subject: string,
  count: number = 10,
  excludeQuestions: string[] = [],
  grade?: number | null
): Promise<MCQQuestion[]> {
  const excludeNote =
    excludeQuestions.length > 0
      ? `\n\nDo NOT repeat: ${excludeQuestions.slice(0, 8).join(' | ')}`
      : ''
  const levelNote = gradeContext(grade)

  const maxTok = Math.max(count * 220, 1800)

  /* ── Attempt 1: JSON format ───────────────────────────────────── */
  let rawText = ''
  try {
    rawText = await callAI(
      [
        {
          role: 'system',
          content: 'You are an exam question generator. Output ONLY a JSON array — no markdown, no explanation.',
        },
        {
          role: 'user',
          content: `Create ${count} MCQ questions on "${topic}" (${subject}).${excludeNote}
${levelNote ? `\nStudent level: ${levelNote}\nAll questions and options MUST match this class level.\n` : ''}
Output ONLY this JSON array (nothing else):
[{"question":"If CP=100 and SP=120, what is profit%?","options":["10%","20%","25%","30%"],"correct":1},
 {"question":"next question?","options":["opt1","opt2","opt3","opt4"],"correct":0}]

- "options": array of 4 strings
- "correct": index 0-3 of correct option
- ${count} questions total`,
        },
      ],
      maxTok,
      0.4,
      JSON_MODELS
    )

    const raw = parseJSON<unknown[]>(rawText, true)
    const questions = normalizeMCQ(raw)
    if (questions.length >= Math.min(3, count)) return questions
    // JSON parsed but no valid objects — fall through to text parser on same response
    const fromText = parseTextMCQ(rawText)
    if (fromText.length >= Math.min(3, count)) return fromText
  } catch {
    // Try text parser on whatever we got
    if (rawText) {
      const fromText = parseTextMCQ(rawText)
      if (fromText.length >= Math.min(3, count)) return fromText
    }
  }

  /* ── Attempt 2: Numbered text format (last resort) ────────────── */
  const textResponse = await callAI(
    [
      {
        role: 'system',
        content: 'You are an exam question generator. Write numbered MCQ questions.',
      },
      {
        role: 'user',
        content: `Write ${count} multiple choice questions on "${topic}" (${subject}).${excludeNote}

Use EXACTLY this format for each question:
1. Question text here?
A) First option
B) Second option
C) Third option
D) Fourth option
Answer: B

2. Next question?
A) ...`,
      },
    ],
    maxTok,
    0.5,
    JSON_MODELS
  )

  const questions = parseTextMCQ(textResponse)
  if (questions.length === 0) {
    throw new Error('Failed to generate questions in any format. Please try again.')
  }
  return questions
}

export async function chatWithTutor(
  subject: string,
  topic: string,
  history: string,
  message: string,
  grade?: number | null
): Promise<string> {
  const levelNote = gradeContext(grade)
  return callAI(
    [
      {
        role: 'system',
        content: `You are a helpful study tutor for ${subject}, topic: ${topic}.${levelNote ? ` ${levelNote}` : ''} Answer in 2-4 clear sentences using language appropriate for this student's level.`,
      },
      { role: 'user', content: history ? `${history}\nStudent: ${message}` : message },
    ],
    500,
    0.8,
    CHAT_MODELS
  )
}

export async function generateFlashcards(
  topic: string,
  subject: string,
  grade?: number | null
): Promise<Array<{ question: string; answer: string }>> {
  const levelNote = gradeContext(grade)
  const text = await callAI(
    [
      {
        role: 'system',
        content: 'You are a flashcard generator. Return ONLY a raw JSON array. No markdown, no code fences.',
      },
      {
        role: 'user',
        content: `Generate 8 study flashcards for Topic: "${topic}", Subject: "${subject}".
${levelNote ? `Student level: ${levelNote}\nFlashcards must match this level.\n` : ''}
Return ONLY this JSON array:
[{"question":"...","answer":"..."}]`,
      },
    ],
    600,
    0.5,
    JSON_MODELS
  )
  return parseJSON<Array<{ question: string; answer: string }>>(text, true)
}

export async function extractTopics(syllabus: string, subject: string): Promise<string[]> {
  const text = await callAI(
    [
      {
        role: 'system',
        content: 'You are a curriculum analyst. Return ONLY a raw JSON array of strings. No markdown, no code fences.',
      },
      {
        role: 'user',
        content: `Extract up to 15 individual study topics (2-6 words each) from this syllabus.
Subject: ${subject}
Syllabus: ${syllabus}

Return ONLY: ["Topic 1","Topic 2","Topic 3"]`,
      },
    ],
    300,
    0.3,
    JSON_MODELS
  )
  const topics = parseJSON<string[]>(text, true)
  return topics.filter((t) => typeof t === 'string' && t.trim().length > 0).slice(0, 15)
}
