# AI Study Buddy — Agent Instructions

## Project Identity
You are a senior full-stack developer working on "AI Study Buddy" — an AI-powered
study platform built with Next.js 14, MongoDB, HuggingFace, shadcn/ui, and Vercel.

---

## Tech Stack (Never change these)
- **Framework**: Next.js 14 App Router + TypeScript (strict mode)
- **Database**: MongoDB Atlas (free M0) + Mongoose ODM
- **AI**: HuggingFace Inference API — model: `mistralai/Mistral-7B-Instruct-v0.3`
- **Auth**: NextAuth.js v5 — Google OAuth + email/password (bcrypt)
- **UI**: shadcn/ui + Radix UI + Tailwind CSS v3
- **Charts**: Recharts
- **Validation**: Zod + React Hook Form
- **Deploy**: Vercel free hobby tier

---

## Folder Structure (Follow strictly)
```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── dashboard/page.tsx
│   ├── subjects/[id]/
│   │   ├── page.tsx
│   │   ├── lesson/page.tsx
│   │   ├── chat/page.tsx
│   │   └── test/page.tsx
│   ├── progress/page.tsx
│   └── api/
│       ├── auth/register/route.ts
│       ├── auth/[...nextauth]/route.ts
│       ├── subjects/route.ts
│       ├── subjects/[id]/route.ts
│       ├── ai/generate-lesson/route.ts
│       ├── ai/chat/route.ts
│       ├── ai/generate-test/route.ts
│       ├── ai/flashcards/route.ts
│       ├── tests/submit/route.ts
│       ├── tests/history/route.ts
│       └── dashboard/route.ts
├── components/
│   ├── ui/               ← shadcn auto-generated — NEVER edit
│   ├── subject-card.tsx
│   ├── add-subject-dialog.tsx
│   ├── chat-box.tsx
│   ├── mcq-card.tsx
│   ├── flashcard.tsx
│   ├── progress-chart.tsx
│   ├── navbar.tsx
│   └── theme-provider.tsx
├── lib/
│   ├── mongodb.ts         ← DB connection singleton
│   ├── huggingface.ts     ← All HF API calls go here
│   ├── auth.ts            ← NextAuth config
│   └── utils.ts           ← cn() + helpers
├── models/
│   ├── User.ts
│   ├── Subject.ts
│   ├── Lesson.ts
│   ├── ChatMessage.ts
│   └── Test.ts
└── types/
    └── index.ts           ← All TypeScript interfaces
```

---

## Coding Rules (Apply to every file you write)

### TypeScript
- Strict mode always — never use `any` type
- Define all interfaces in `types/index.ts`
- Import types with `import type { ... }`
- Use `@/` path alias for all internal imports

### Components
- Functional components only — no class components
- Every component that calls an API must have a loading state (use shadcn `Skeleton`)
- Every form must use React Hook Form + Zod schema
- Use shadcn `Sonner` for all toast notifications (green = success, red = error)

### API Routes
- Every protected route must start with:
  ```ts
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  ```
- Always wrap in try/catch — return meaningful error messages
- Always return `NextResponse.json()`

### Database
- ALWAYS use `lib/mongodb.ts` singleton — never call `mongoose.connect()` directly
- Every Mongoose model must have this guard at the bottom:
  ```ts
  export default mongoose.models.ModelName || mongoose.model('ModelName', schema)
  ```

### Styling
- Tailwind utility classes only — zero inline styles, zero separate CSS files
- Mobile-first responsive: use `sm:` `md:` `lg:` breakpoints
- Dark mode is handled by shadcn ThemeProvider — do not hardcode colors

---

## MongoDB Models

### User
```ts
{ name: String, email: String (unique), password: String (nullable),
  image: String, createdAt: Date }
```

### Subject
```ts
{ userId: ObjectId, name: String, syllabus: String,
  topics: [String], createdAt: Date }
```

### Lesson
```ts
{ subjectId: ObjectId, userId: ObjectId, topic: String,
  content: String, flashcards: [{ question: String, answer: String }],
  createdAt: Date }
```

### ChatMessage
```ts
{ subjectId: ObjectId, userId: ObjectId, topic: String,
  role: 'user' | 'assistant', content: String, createdAt: Date }
```

### Test
```ts
{ subjectId: ObjectId, userId: ObjectId, topic: String,
  questions: [{ question: String, options: [String], correct: Number }],
  userAnswers: [Number], score: Number, timeTaken: Number, takenAt: Date }
```

---

## AI API — OpenRouter (Free tier)

### Free models available on OpenRouter
- `meta-llama/llama-3.1-8b-instruct:free`      ← Primary (best quality, free)
- `mistralai/mistral-7b-instruct:free`           ← Fallback option 1
- `google/gemma-2-9b-it:free`                    ← Fallback option 2

### Base helper (src/lib/openrouter.ts)
```ts
const BASE_URL = 'https://openrouter.ai/api/v1/chat/completions'

async function callAI(
  messages: { role: string; content: string }[],
  maxTokens: number = 800,
  temperature: number = 0.7
) {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXTAUTH_URL || 'http://localhost:3000',
      'X-Title': 'AI Study Buddy',
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-3.1-8b-instruct:free',
      messages,
      max_tokens: maxTokens,
      temperature,
    })
  })
  if (!res.ok) throw new Error(`OpenRouter error: ${res.status}`)
  const data = await res.json()
  return data.choices[0].message.content
}
```

### Token limits
- Lesson generation: maxTokens 1000, temperature 0.7
- MCQ generation:    maxTokens 800,  temperature 0.3
- Chat tutor:        maxTokens 500,  temperature 0.8
- Flashcards:        maxTokens 600,  temperature 0.5

### Prompt format (OpenRouter uses messages array — NOT [INST] tags)

**Lesson prompt:**
### Prompt templates

**Lesson generation** (maxTokens: 800, temperature: 0.7):
```
[INST] You are a study tutor. Generate a detailed lesson for:
Topic: {topic}
Subject: {subject}

Return ONLY this JSON (no extra text):
{
  "content": "markdown lesson text minimum 400 words",
  "flashcards": [{"question": "...", "answer": "..."}, ...]
}
[/INST]
```

**MCQ generation** (maxTokens: 600, temperature: 0.3):
```
[INST] Generate exactly 10 multiple choice questions for:
Topic: {topic}, Subject: {subject}

Return ONLY this JSON array (no extra text):
[{"question": "...", "options": ["A","B","C","D"], "correct": 0}, ...]

"correct" is the index 0-3 of the right answer.
[/INST]
```

**Chat tutor** (maxTokens: 400, temperature: 0.8):
```
[INST] You are a helpful study tutor for {subject}.
Topic being studied: {topic}

Chat history:
{history}

Student asks: {message}

Answer clearly in 2-4 sentences. Simple language only. [/INST]
```

---

## Environment Variables
```
MONGODB_URI=            # MongoDB Atlas connection string
NEXTAUTH_SECRET=        # Random 32-char string
NEXTAUTH_URL=           # http://localhost:3000
GOOGLE_CLIENT_ID=       # Google Cloud Console
GOOGLE_CLIENT_SECRET=   # Google Cloud Console
HUGGINGFACE_API_KEY=    # huggingface.co/settings/tokens (hf_xxx)
```

---

## shadcn Components List (already installed)
```
button input textarea card dialog select label progress
badge tabs avatar skeleton separator scroll-area sonner
```
Install command if missing:
```bash
npx shadcn@latest add [component-name]
```

---

## Task Execution Rules

1. **Always write complete files** — never write partial code or "// rest of code here"
2. **One feature = all related files** — when building auth, create ALL auth files at once
3. **Read before writing** — always read existing related files before creating new ones
4. **Fix errors yourself** — if you create an error, fix it in the same response
5. **Announce new packages** — tell the user to run `npm install` before using new packages
6. **Never leave TODOs** — every function must be fully implemented

---

## Feature Build Order
```
Phase 1 (Foundation):  lib/mongodb.ts → lib/huggingface.ts → lib/auth.ts → types/index.ts → all models
Phase 2 (Auth):        register/login pages → NextAuth routes → middleware.ts
Phase 3 (Subjects):    dashboard → subject CRUD → syllabus upload → topic extraction
Phase 4 (AI Features): lesson generation → chat tutor → MCQ test → flashcards
Phase 5 (Progress):    test submit → score history → progress charts → streak tracker
Phase 6 (Deploy):      .env on Vercel → test production → custom domain (optional)
```

---

## Common Mistakes to Avoid
- Do NOT use `mongoose.connect()` directly — use `lib/mongodb.ts`
- Do NOT edit files inside `components/ui/` — they are shadcn auto-generated
- Do NOT use `any` in TypeScript — define proper types
- Do NOT forget `getServerSession()` in protected API routes
- Do NOT use OpenAI or Anthropic API — only HuggingFace
- Do NOT write inline styles — Tailwind only
- Do NOT leave `console.log` in production code