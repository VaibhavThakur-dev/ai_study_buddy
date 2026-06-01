'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { IFlashcard } from '@/types'

interface FlashcardProps {
  flashcards: IFlashcard[]
}

export default function Flashcard({ flashcards }: FlashcardProps) {
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)

  if (!flashcards.length) return null

  const card = flashcards[index]

  function prev() {
    setFlipped(false)
    setIndex((i) => (i - 1 + flashcards.length) % flashcards.length)
  }

  function next() {
    setFlipped(false)
    setIndex((i) => (i + 1) % flashcards.length)
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex items-center gap-2">
        <Badge variant="outline">
          {index + 1} / {flashcards.length}
        </Badge>
        <span className="text-xs text-muted-foreground">Click card to flip</span>
      </div>

      <Card
        onClick={() => setFlipped((f) => !f)}
        className="w-full max-w-xl min-h-[220px] flex items-center justify-center cursor-pointer select-none hover:shadow-md transition-shadow p-8 text-center"
      >
        <div className="space-y-3">
          <Badge variant={flipped ? 'default' : 'secondary'} className="text-xs">
            {flipped ? 'Answer' : 'Question'}
          </Badge>
          <p className="text-lg font-medium leading-relaxed">
            {flipped ? card.answer : card.question}
          </p>
        </div>
      </Card>

      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={prev}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { setFlipped(false); setIndex(0) }}
        >
          <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
          Restart
        </Button>
        <Button variant="outline" size="icon" onClick={next}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
