// src/components/ItemCard.tsx
import { useMutation } from 'convex/react'
import { api } from '@@/convex/_generated/api'
import type { Id } from '@@/convex/_generated/dataModel'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
  CheckSquare,
  Image as ImageIcon,
  File as FileIcon,
  Edit2,
  Trash2,
  ExternalLink,
  Calendar,
} from 'lucide-react'
import { useState } from 'react'

interface Item {
  _id: Id<'items'>
  type: 'link' | 'note' | 'todo' | 'image' | 'file'
  stackSize: number
  url?: string | null
  title?: string
  content?: string
  label?: string
  completed?: boolean
  filename?: string
  mimeType?: string
  dateTime?: number
  tags?: string[]
  linkPreview?: {
    title?: string
    description?: string
    image?: string
    siteName?: string
  }
}

interface ItemCardProps {
  item: Item
  canInteract: boolean
  onEdit: (item: Item) => void
}

export function ItemCard({ item, canInteract, onEdit }: ItemCardProps) {
  const deleteItem = useMutation(api.items.deleteItem)
  const updateItem = useMutation(api.items.updateItem)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleDelete = async () => {
    try {
      await deleteItem({ itemId: item._id })
      toast.success('Item deleted')
      setShowDeleteDialog(false)
    } catch (error) {
      toast.error('Failed to delete item')
    }
  }

  const handleToggleTodo = async (checked: boolean) => {
    if (!canInteract || item.type !== 'todo') return
    try {
      await updateItem({
        itemId: item._id,
        completed: checked,
      })
    } catch (error) {
      toast.error('Failed to update todo')
    }
  }

  const getItemIcon = () => {
    const iconClass = 'h-4 w-4'
    switch (item.type) {
      case 'link':
        return <Link2 className={iconClass} />
      case 'note':
        return <FileText className={iconClass} />
      case 'todo':
        return <CheckSquare className={iconClass} />
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

  return (
    <>
      <Card
        className={`group hover:shadow-lg transition-all ${item.type === 'todo' && item.completed ? 'opacity-60' : ''}`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {item.type === 'todo' ? (
                <Checkbox
                  checked={item.completed || false}
                  onCheckedChange={handleToggleTodo}
                  disabled={!canInteract}
                  className="mt-1"
                />
              ) : (
                <div className="text-muted-foreground mt-1">
                  {getItemIcon()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <CardTitle
                  className={`text-base ${item.type === 'todo' && item.completed ? 'line-through text-muted-foreground' : ''}`}
                >
                  {item.title || item.label || item.filename || 'Untitled'}
                </CardTitle>
                {item.type === 'link' && item.url && (
                  <CardDescription className="truncate text-xs mt-1 flex items-center gap-1">
                    <ExternalLink className="h-3 w-3" />
                    {new URL(item.url).hostname}
                  </CardDescription>
                )}
              </div>
            </div>
            {canInteract && (
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onEdit(item)}
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
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
              {item.content}
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
                <p className="text-sm font-medium truncate">{item.filename}</p>
                <p className="text-xs text-muted-foreground">{item.mimeType}</p>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </a>
          )}

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {item.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
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
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Item?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this
              item.
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
