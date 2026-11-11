import { Check } from 'lucide-react'
import { useId } from 'react'

import type { AttemptQuestion } from '@/api/types'
import { MathText } from '@/components/math-text'
import { Input, Label } from '@/components/ui/input'
import { t } from '@/lib/strings.uz'

type AnswerInputProps = {
  question: AttemptQuestion
  value: string
  onChoose: (option: string) => void
  onType: (text: string) => void
  onTypeDone: () => void
}

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

export function AnswerInput({ question, value, onChoose, onType, onTypeDone }: AnswerInputProps) {
  const id = useId()

  if (question.type === 'short_answer' || !question.options?.length) {
    return (
      <div className="flex flex-col gap-2">
        <Label htmlFor={id}>{t.quiz.shortAnswerLabel}</Label>
        <Input
          id={id}
          value={value}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          enterKeyHint="done"
          placeholder={t.quiz.shortAnswerPlaceholder}
          onChange={(e) => onType(e.target.value)}
          onBlur={onTypeDone}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur()
          }}
        />
      </div>
    )
  }

  return (
    <fieldset>
      <legend className="sr-only">{question.prompt}</legend>
      <div className="flex flex-col gap-3">
        {question.options.map((option, i) => {
          const checked = value === option
          return (
            <label
              key={option}
              className="flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border-2 border-border bg-card px-4 py-3 transition-colors hover:border-input has-checked:border-primary has-checked:bg-primary-soft has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring"
            >
              <input
                type="radio"
                name={`q-${question.questionId}`}
                value={option}
                checked={checked}
                onChange={() => onChoose(option)}
                className="sr-only"
              />
              <span
                aria-hidden
                className={
                  checked
                    ? 'grid size-8 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground'
                    : 'grid size-8 shrink-0 place-items-center rounded-full bg-muted text-sm font-semibold text-muted-foreground'
                }
              >
                {checked ? <Check className="size-4" /> : LETTERS[i]}
              </span>
              <MathText text={option} className="text-base leading-snug" />
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
