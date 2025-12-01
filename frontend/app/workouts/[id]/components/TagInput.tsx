'use client'

import { Input } from '@/components/ui/input'
import { X } from 'lucide-react'
import { KeyboardEvent, useState } from 'react'

interface TagInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
}

export function TagInput({ value, onChange, placeholder = 'Ajouter...', label }: TagInputProps) {
  const [inputValue, setInputValue] = useState('')

  // Parse current tags from comma-separated string
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
      {label && <label className="text-sm font-medium">{label}</label>}

      {/* Tags display */}
      <div className="flex flex-wrap gap-2 min-h-[38px] p-2 border rounded-md bg-background">
        {tags.map((tag, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-sm"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(index)}
              className="hover:bg-primary/20 rounded-full p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}

        {/* Input for new tag */}
        <Input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => inputValue.trim() && addTag(inputValue.trim())}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] border-0 focus-visible:ring-0 shadow-none p-0 h-auto"
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Appuyez sur Entrée ou cliquez ailleurs pour ajouter
      </p>
    </div>
  )
}
