// src/components/ItemDialog.tsx - Simplified without labels
import { useState, useRef, useEffect } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@@/convex/_generated/api'
import type { Id } from '@@/convex/_generated/dataModel'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { TagInput } from './TagInput'

interface ItemDialogProps {
  chestId: Id<'chests'>
  item: any | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ItemDialog({
  chestId,
  item,
  open,
  onOpenChange,
}: ItemDialogProps) {
  const updateItem = useMutation(api.items.updateItem)
  const items = useQuery(api.items.getChestItems, { chestId })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [label, setLabel] = useState('')
  const [dateTime, setDateTime] = useState('')
  const [tags, setTags] = useState<string[]>([])

  const isEditing = item !== null

  // Get all existing tags for suggestions
  const allTags = Array.from(
    new Set(items?.flatMap((i) => i.tags || []) || []),
  ).sort()

  useEffect(() => {
    if (item && open) {
      setUrl(item.url || '')
      setTitle(item.title || '')
      setContent(item.content || '')
      setLabel(item.label || '')
      setTags(item.tags || [])
      if (item.dateTime) {
        const d = new Date(item.dateTime)
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
        setDateTime(d.toISOString().slice(0, 16))
      } else {
        setDateTime('')
      }
    } else if (!open) {
      // Reset form when dialog closes
      setUrl('')
      setTitle('')
      setContent('')
      setLabel('')
      setDateTime('')
      setTags([])
    }
  }, [item, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isEditing) return

    setIsSubmitting(true)
    try {
      const parsedDateTime = dateTime ? new Date(dateTime).getTime() : undefined

      const updates: any = {
        itemId: item._id,
        tags: tags.length > 0 ? tags : undefined,
        dateTime: parsedDateTime,
      }

      // Add type-specific fields
      if (item.type === 'link') {
        updates.url = url.trim() || undefined
        updates.title = title.trim() || undefined
      } else if (item.type === 'note') {
        updates.content = content.trim() || undefined
      } else if (item.type === 'todo') {
        updates.label = label.trim() || undefined
      }

      await updateItem(updates)
      toast.success('Item updated successfully!')
      onOpenChange(false)
    } catch (error) {
      console.error('Error updating item:', error)
      toast.error('Failed to update item')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isEditing) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Item</DialogTitle>
          <DialogDescription>
            Update the details of this {item?.type}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Type-specific fields */}
          {item?.type === 'link' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Link title"
                />
              </div>
            </>
          )}

          {item?.type === 'note' && (
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your note..."
                rows={8}
              />
            </div>
          )}

          {item?.type === 'todo' && (
            <div className="space-y-2">
              <Label htmlFor="label">Todo Item</Label>
              <Input
                id="label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="What needs to be done?"
              />
            </div>
          )}

          {/* Date & Time */}
          <div className="space-y-2">
            <Label htmlFor="dateTime">Date & Time (optional)</Label>
            <Input
              id="dateTime"
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
            />
          </div>

          {/* Tags */}
          <TagInput
            tags={tags}
            onChange={setTags}
            suggestions={allTags}
            placeholder="Add tags (press Enter or comma)"
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
