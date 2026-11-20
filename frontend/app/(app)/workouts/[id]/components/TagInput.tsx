'use client'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { KeyboardEvent, useId, useState } from 'react'

interface TagInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
}

/**
 * Champ de saisie de tags (chips) à partir d'une chaîne unique séparée par des virgules.
 * Ajout via Entrée, suppression via le bouton × ou Retour arrière sur champ vide.
 */
export function TagInput({ value, onChange, placeholder = 'Ajouter...', label }: TagInputProps) {
  const inputId = useId()
  const [inputValue, setInputValue] = useState('')

  const tags = value ? value.split(',').map(t => t.trim()).filter(Boolean) : []

  const addTag = (tag: string) => {
    if (tag && !tags.includes(tag)) {
      const newTags = [...tags, tag]
      onChange(newTags.join(', '))
    }
    setInputValue('')
  }

  const removeTag = (indexToRemove: number) => {
    const newTags = tags.filter((_, index) => index !== indexToRemove)
    onChange(newTags.join(', '))
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag(inputValue.trim())
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags.length - 1)
    }
  }

  return (
    <div className="space-y-2">
      {label && <label htmlFor={inputId} className="text-sm font-medium text-foreground">{label}</label>}

      <div className="flex flex-wrap gap-2 min-h-[46px] p-3 border border-border rounded-xl bg-background">
        {tags.map((tag, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/15 text-primary rounded-lg text-sm font-medium"
          >
            {tag}
            <Button variant="ghost"
              type="button"
              aria-label={`Supprimer le tag ${tag}`}
              onClick={() => removeTag(index)}
              className="hover:bg-primary/25 rounded-full p-0.5 transition-colors"
            >
              <span className="text-xs">×</span>
            </Button>
          </span>
        ))}

        <Input
          id={inputId}
          aria-label={label ? undefined : 'Ajouter un tag'}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => inputValue.trim() && addTag(inputValue.trim())}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] bg-transparent border-0 text-foreground placeholder:text-muted-foreground outline-none text-sm"
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Appuyez sur Entrée ou cliquez ailleurs pour ajouter
      </p>
    </div>
  )
}
