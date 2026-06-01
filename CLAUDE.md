@AGENTS.md

# AI Study Buddy — Project Context

## What this project is
AI-powered study platform. Students paste their syllabus, AI generates lessons,
they chat with an AI tutor, take MCQ tests, and track their progress.

## Stack (never change)
- Next.js 14 App Router + TypeScript
- MongoDB Atlas + Mongoose
- OpenRouter API (free) — model: meta-llama/llama-3.1-8b-instruct:free
- NextAuth.js v5
- shadcn/ui + Tailwind CSS
- Vercel (free deploy)

## Key rules
- All AI calls go through `src/lib/openrouter.ts` only
- All DB calls go through `src/lib/mongodb.ts` singleton only
- Never use `any` in TypeScript
- Never edit files inside `src/components/ui/`
- Every protected API route must check `getServerSession()`
- Tailwind classes only — no inline styles

## What is already built (DO NOT rebuild these)
- Phase 1 — mongodb.ts, auth.ts, types/index.ts, all Mongoose models
- Phase 2 — Login/Register pages, NextAuth routes, middleware
- Phase 3 — Dashboard, Subject CRUD, syllabus upload, topic extraction

## Current build phase
Phase 4 — AI Features (lesson generation, chat tutor, MCQ test, flashcards)

## Environment variables status
- MONGODB_URI — set
- NEXTAUTH_SECRET — set
- NEXTAUTH_URL — http://localhost:3000
- OPENROUTER_API_KEY — set (replaces HuggingFace)
- GOOGLE_CLIENT_ID — skip for now
- GOOGLE_CLIENT_SECRET — skip for now