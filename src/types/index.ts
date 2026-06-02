export interface IUser {
  _id: string
  name: string
  email: string
  password?: string | null
  image?: string
  grade?: number | null
  createdAt: Date
}

export interface IUserProfile {
  name: string
  email: string
  image?: string
  grade?: number | null
  age?: number | null
}

export interface ISubject {
  _id: string
  userId: string
  name: string
  syllabus: string
  topics: string[]
  createdAt: Date
}

export interface IFlashcard {
  question: string
  answer: string
}

export interface ILesson {
  _id: string
  subjectId: string
  userId: string
  topic: string
  content: string
  flashcards: IFlashcard[]
  createdAt: Date
}

export interface IChatMessage {
  _id: string
  subjectId: string
  userId: string
  topic: string
  role: 'user' | 'assistant'
  content: string
  createdAt: Date
}

export interface IMCQQuestion {
  question: string
  options: string[]
  correct: number
}

export interface ITest {
  _id: string
  subjectId: string
  userId: string
  topic: string
  questions: IMCQQuestion[]
  userAnswers: number[]
  score: number
  timeTaken: number
  takenAt: Date
}

export interface IProgressStat {
  topic: string
  subjectName: string
  averageScore: number
  testCount: number
}

export interface IDashboardData {
  subjects: ISubject[]
  recentTests: ITest[]
  studyStreak: number
  weakTopics: IProgressStat[]
}

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string }
