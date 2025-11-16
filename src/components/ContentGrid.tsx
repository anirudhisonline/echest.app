// src/components/ContentGrid.tsx
import { useMemo, useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '@@/convex/_generated/api'
import type { Id } from '@@/convex/_generated/dataModel'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Link2,
  FileText,
  Image as ImageIcon,
  File as FileIcon,
  Trash2,
  ExternalLink,
  Calendar,
  Edit2,
} from 'lucide-react'

interface ContentItem {
  _id: Id<'items'>
  type: 'link' | 'note' | 'image' | 'file'
  url?: string | null
  title?: string
  content?: string
  filename?: string
  mimeType?: string
  dateTime?: number
  tags?: string[]
  linkPreview?: {
    title?: string
    description?: string
    image?: string
  }
}

interface ContentGridProps {
  items: ContentItem[]
  canInteract: boolean
  searchQuery: string
  selectedTags: string[]
  typeFilter: string
  viewMode: 'all' | 'today' | 'week' | 'month'
  onEditItem: (item: ContentItem) => void
}

export function ContentGrid({
  items,
  canInteract,
  searchQuery,
  selectedTags,
  typeFilter,
  viewMode,
  onEditItem,
}: ContentGridProps) {
  const deleteItem = useMutation(api.items.deleteItem)
  const [deletingId, setDeletingId] = useState<Id<'items'> | null>(null)

  // Filter items
  const filteredItems = useMemo(() => {
    let filtered = [...items]

    // Filter by date view mode
    if (viewMode !== 'all') {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

      filtered = filtered.filter((item) => {
        if (!item.dateTime) return false
        const itemDate = new Date(item.dateTime)
        const itemDay = new Date(
          itemDate.getFullYear(),
          itemDate.getMonth(),
          itemDate.getDate(),
        )

        if (viewMode === 'today') {
          return itemDay.getTime() === today.getTime()
        } else if (viewMode === 'week') {
          const weekFromNow = new Date(
            today.getTime() + 7 * 24 * 60 * 60 * 1000,
          )
          return itemDay >= today && itemDay <= weekFromNow
        } else if (viewMode === 'month') {
          const monthFromNow = new Date(
            today.getFullYear(),
            today.getMonth() + 1,
            today.getDate(),
          )
          return itemDay >= today && itemDay <= monthFromNow
        }
        return true
      })
    }

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter((item) => item.type === typeFilter)
    }

    // Filter by tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter((item) =>
        selectedTags.some((tag) => item.tags?.includes(tag)),
      )
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((item) => {
        const searchableText = [
          item.title,
          item.content,
          item.filename,
          ...(item.tags || []),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return searchableText.includes(query)
      })
    }

    // Sort by date (most recent first)
    return filtered.sort((a, b) => {
      if (!a.dateTime && !b.dateTime) return 0
      if (!a.dateTime) return 1
      if (!b.dateTime) return -1
      return b.dateTime - a.dateTime
    })
  }, [items, viewMode, typeFilter, selectedTags, searchQuery])

  const handleDelete = async () => {
    if (!deletingId) return
    try {
      await deleteItem({ itemId: deletingId })
      toast.success('Item deleted')
      setDeletingId(null)
    } catch (error) {
      toast.error('Failed to delete item')
    }
  }

  const getItemIcon = (type: string) => {
    const iconClass = 'h-4 w-4'
    switch (type) {
      case 'link':
        return <Link2 className={iconClass} />
      case 'note':
        return <FileText className={iconClass} />
      case 'image':
        return <ImageIcon className={iconClass} />
      case 'file':
        return <FileIcon className={iconClass} />
      default:
        return <FileText className={iconClass} />
    }
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const itemDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    )

    if (itemDate.getTime() === today.getTime()) {
      return `Today at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
    } else if (itemDate.getTime() === today.getTime() - 86400000) {
      return `Yesterday at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    }
  }

  if (filteredItems.length === 0) {
    return (
      <div className="bg-card border rounded-lg p-12">
        <div className="text-center text-muted-foreground">
          <p>No items found</p>
          <p className="text-sm mt-2">
            Try adjusting your filters or add new content below
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => (
          <div
            key={item._id}
            className="bg-card border rounded-lg group hover:shadow-lg transition-all overflow-hidden flex flex-col"
          >
            <div className="p-4 pb-3 border-b">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="text-muted-foreground mt-1">
                    {getItemIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold truncate">
                      {item.type === 'note' && item.content
                        ? item.content.split('\n')[0] || 'Empty note'
                        : item.title || item.filename || 'Untitled'}
                    </h3>
                    {item.type === 'link' && item.url && (
                      <p className="truncate text-xs mt-1 flex items-center gap-1 text-muted-foreground">
                        <ExternalLink className="h-3 w-3" />
                        {new URL(item.url).hostname}
                      </p>
                    )}
                  </div>
                </div>
                {canInteract && (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => onEditItem(item)}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                      onClick={() => setDeletingId(item._id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 space-y-3 flex-1">
              {/* Link Preview */}
              {item.type === 'link' && item.linkPreview && (
                <a
                  href={item.url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block border rounded-lg overflow-hidden hover:border-primary transition-colors"
                >
                  {item.linkPreview.image && (
                    <img
                      src={item.linkPreview.image}
                      alt={item.linkPreview.title}
                      className="w-full h-32 object-cover"
                    />
                  )}
                  <div className="p-3">
                    {item.linkPreview.title && (
                      <p className="font-medium text-sm line-clamp-1">
                        {item.linkPreview.title}
                      </p>
                    )}
                    {item.linkPreview.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {item.linkPreview.description}
                      </p>
                    )}
                  </div>
                </a>
              )}

              {/* Regular Link */}
              {item.type === 'link' && !item.linkPreview && item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  Open Link
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}

              {/* Note Content */}
              {item.type === 'note' && item.content && (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-4">
                  {item.content.split('\n').slice(1).join('\n') || item.content}
                </p>
              )}

              {/* Image */}
              {item.type === 'image' && item.url && (
                <img
                  src={item.url}
                  alt={item.filename || 'Image'}
                  className="w-full h-48 object-cover rounded-md cursor-pointer"
                  onClick={() => window.open(item.url!, '_blank')}
                />
              )}

              {/* File */}
              {item.type === 'file' && item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 border rounded-lg hover:border-primary transition-colors"
                >
                  <FileIcon className="h-8 w-8 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {item.filename}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.mimeType}
                    </p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </a>
              )}

              {/* Tags */}
              {item.tags && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {item.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* DateTime */}
              {item.dateTime && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {formatDate(item.dateTime)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <AlertDialog
        open={deletingId !== null}
        onOpenChange={(open) => !open && setDeletingId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Item?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
