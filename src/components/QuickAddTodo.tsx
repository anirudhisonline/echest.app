// src/components/QuickAddTodo.tsx
import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '@@/convex/_generated/api'
import type { Id } from '@@/convex/_generated/dataModel'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Plus, Check } from 'lucide-react'

interface QuickAddTodoProps {
  chestId: Id<'chests'>
}

export function QuickAddTodo({ chestId }: QuickAddTodoProps) {
  const addItem = useMutation(api.items.addItem)
  const [label, setLabel] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!label.trim()) return

    setIsAdding(true)
    try {
      // Parse tags from label (e.g., "Buy milk #shopping #urgent")
      const tagRegex = /#(\w+)/g
      const tags = Array.from(label.matchAll(tagRegex)).map((match) => match[1])
      const cleanLabel = label.replace(/#\w+/g, '').trim()

      await addItem({
        chestId,
        type: 'todo',
        label: cleanLabel,
        tags: tags.length > 0 ? tags : undefined,
      })
      setLabel('')
      toast.success('Todo added!')
    } catch (error) {
      toast.error('Failed to add todo')
    } finally {
      setIsAdding(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div
      className={`bg-card border rounded-lg p-3 transition-all ${
        isFocused ? 'ring-2 ring-ring' : ''
      }`}
    >
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1 flex items-center gap-2">
          <Plus className="h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Add a quick todo... (Press Enter) - Use #tags"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            disabled={isAdding}
            className="border-0 focus-visible:ring-0 shadow-none px-0"
          />
        </div>
        {label.trim() && (
          <Button
            type="submit"
            size="icon"
            disabled={isAdding}
            className="h-9 w-9"
          >
            <Check className="h-4 w-4" />
          </Button>
        )}
      </form>
    </div>
  )
}
