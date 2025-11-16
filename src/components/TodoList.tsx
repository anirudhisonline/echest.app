// src/components/TodoList.tsx
import { useMemo, useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '@@/convex/_generated/api'
import type { Id } from '@@/convex/_generated/dataModel'
import { toast } from 'sonner'
import { Checkbox } from '@/components/ui/checkbox'
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
import { Trash2, Calendar, ChevronDown, ChevronUp, Edit2 } from 'lucide-react'

interface Todo {
  _id: Id<'items'>
  type: 'todo'
  label?: string
  completed?: boolean
  dateTime?: number
  tags?: string[]
}

interface TodoListProps {
  todos: Todo[]
  canInteract: boolean
  searchQuery: string
  selectedTags: string[]
  viewMode: 'all' | 'today' | 'week' | 'month'
  onEditTodo: (todo: Todo) => void
}

export function TodoList({
  todos,
  canInteract,
  searchQuery,
  selectedTags,
  viewMode,
  onEditTodo,
}: TodoListProps) {
  const updateItem = useMutation(api.items.updateItem)
  const deleteItem = useMutation(api.items.deleteItem)

  const [showCompleted, setShowCompleted] = useState(false)
  const [deletingId, setDeletingId] = useState<Id<'items'> | null>(null)

  // Filter todos
  const filteredTodos = useMemo(() => {
    let filtered = [...todos]

    // Filter by date view mode
    if (viewMode !== 'all') {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

      filtered = filtered.filter((todo) => {
        if (!todo.dateTime) return false
        const todoDate = new Date(todo.dateTime)
        const todoDay = new Date(
          todoDate.getFullYear(),
          todoDate.getMonth(),
          todoDate.getDate(),
        )

        if (viewMode === 'today') {
          return todoDay.getTime() === today.getTime()
        } else if (viewMode === 'week') {
          const weekFromNow = new Date(
            today.getTime() + 7 * 24 * 60 * 60 * 1000,
          )
          return todoDay >= today && todoDay <= weekFromNow
        } else if (viewMode === 'month') {
          const monthFromNow = new Date(
            today.getFullYear(),
            today.getMonth() + 1,
            today.getDate(),
          )
          return todoDay >= today && todoDay <= monthFromNow
        }
        return true
      })
    }

    // Filter by tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter((todo) =>
        selectedTags.some((tag) => todo.tags?.includes(tag)),
      )
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((todo) =>
        [todo.label, ...(todo.tags || [])].some((text) =>
          text?.toLowerCase().includes(query),
        ),
      )
    }

    return filtered
  }, [todos, viewMode, selectedTags, searchQuery])

  const incompleteTodos = filteredTodos.filter((todo) => !todo.completed)
  const completedTodos = filteredTodos.filter((todo) => todo.completed)

  const handleToggle = async (todoId: Id<'items'>, completed: boolean) => {
    try {
      await updateItem({ itemId: todoId, completed })
    } catch (error) {
      toast.error('Failed to update todo')
    }
  }

  const handleDelete = async () => {
    if (!deletingId) return
    try {
      await deleteItem({ itemId: deletingId })
      toast.success('Todo deleted')
      setDeletingId(null)
    } catch (error) {
      toast.error('Failed to delete todo')
    }
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todoDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    )

    const diffDays = Math.floor(
      (todoDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    )

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Tomorrow'
    if (diffDays === -1) return 'Yesterday'
    if (diffDays > 0 && diffDays <= 7) return `In ${diffDays} days`
    if (diffDays < 0 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  if (filteredTodos.length === 0) return null

  return (
    <>
      <div className="bg-card border rounded-lg">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              Tasks ({incompleteTodos.length})
            </h2>
            {completedTodos.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCompleted(!showCompleted)}
              >
                {showCompleted ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-2" />
                    Hide completed ({completedTodos.length})
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-2" />
                    Show completed ({completedTodos.length})
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
        <div className="p-2 space-y-1">
          {/* Incomplete Todos */}
          {incompleteTodos.map((todo) => (
            <div
              key={todo._id}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
            >
              <Checkbox
                checked={false}
                onCheckedChange={(checked) =>
                  handleToggle(todo._id, checked as boolean)
                }
                disabled={!canInteract}
                className="mt-1"
              />
              <div className="flex-1 min-w-0 space-y-1">
                <p className="text-sm font-medium">{todo.label}</p>
                <div className="flex flex-wrap items-center gap-2">
                  {todo.dateTime && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDate(todo.dateTime)}
                    </div>
                  )}
                  {todo.tags?.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>
              {canInteract && (
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onEditTodo(todo)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                    onClick={() => setDeletingId(todo._id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          ))}

          {/* Completed Todos */}
          {showCompleted &&
            completedTodos.map((todo) => (
              <div
                key={todo._id}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group opacity-60"
              >
                <Checkbox
                  checked={true}
                  onCheckedChange={(checked) =>
                    handleToggle(todo._id, checked as boolean)
                  }
                  disabled={!canInteract}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-sm font-medium line-through text-muted-foreground">
                    {todo.label}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    {todo.dateTime && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatDate(todo.dateTime)}
                      </div>
                    )}
                    {todo.tags?.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                {canInteract && (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => onEditTodo(todo)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                      onClick={() => setDeletingId(todo._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>

      <AlertDialog
        open={deletingId !== null}
        onOpenChange={(open) => !open && setDeletingId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Todo?</AlertDialogTitle>
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
