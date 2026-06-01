'use client'

import { CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { IMCQQuestion } from '@/types'

interface MCQCardProps {
  question: IMCQQuestion
  index: number
  selectedAnswer: number | null
  showResult: boolean
  onSelect: (index: number) => void
}

export default function MCQCard({
  question,
  index,
  selectedAnswer,
  showResult,
  onSelect,
}: MCQCardProps) {
  if (!question?.options?.length) {
    return (
      <div className="p-4 border rounded-lg text-sm text-muted-foreground">
        Question {index + 1} data unavailable.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="font-medium text-base leading-snug">
        <span className="text-muted-foreground mr-2">{index + 1}.</span>
        {question.question}
      </p>

      <div className="space-y-2">
        {question.options.map((option, i) => {
          const isSelected = selectedAnswer === i
          const isCorrect = question.correct === i
          const showCorrect = showResult && isCorrect
          const showWrong = showResult && isSelected && !isCorrect

          return (
            <button
              key={i}
              onClick={() => !showResult && onSelect(i)}
              disabled={showResult}
              className={cn(
                'w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors',
                !showResult && !isSelected && 'hover:bg-muted border-border',
                !showResult && isSelected && 'bg-primary/10 border-primary text-primary font-medium',
                showCorrect && 'bg-green-50 border-green-500 text-green-700 dark:bg-green-950 dark:text-green-300',
                showWrong && 'bg-red-50 border-red-400 text-red-700 dark:bg-red-950 dark:text-red-300',
                showResult && !isSelected && !isCorrect && 'opacity-50 border-border'
              )}
            >
              <span className="flex items-center justify-between gap-2">
                <span>
                  <span className="font-medium mr-2">{['A', 'B', 'C', 'D'][i]}.</span>
                  {option}
                </span>
                {showCorrect && <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />}
                {showWrong && <XCircle className="h-4 w-4 shrink-0 text-red-500" />}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
