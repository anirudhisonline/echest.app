// src/components/ItemList.tsx
import { useState, useMemo } from 'react'
import { ItemCard } from './ItemCard'
import { QuickAddTodo } from './QuickAddTodo'
import type { Id } from '@@/convex/_generated/dataModel'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Calendar, LayoutGrid, List, Filter, X, Search } from 'lucide-react'

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
  }
}

interface ItemListProps {
  items: Item[]
  canInteract: boolean
  onEditItem: (item: Item) => void
  chestId: Id<'chests'>
}

type ViewMode = 'all' | 'today' | 'week' | 'month'
type LayoutMode = 'grid' | 'list'

export function ItemList({
  items,
  canInteract,
  onEditItem,
  chestId,
}: ItemListProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('all')
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('grid')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  // Extract all unique tags
  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    items.forEach((item) => {
      item.tags?.forEach((tag) => tagSet.add(tag))
    })
    return Array.from(tagSet).sort()
  }, [items])

  // Filter items based on view mode, tags, search, and type
  const filteredItems = useMemo(() => {
    let filtered = [...items]

    // Filter by view mode (date-based)
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

    // Filter by tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter((item) =>
        selectedTags.some((tag) => item.tags?.includes(tag)),
      )
    }

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter((item) => item.type === typeFilter)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((item) => {
        const searchableText = [
          item.title,
          item.label,
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

    return filtered
  }, [items, viewMode, selectedTags, searchQuery, typeFilter])

  // Separate and sort items: incomplete todos first, then by date
  const sortedItems = useMemo(() => {
    const todos = filteredItems.filter((item) => item.type === 'todo')
    const incompleteTodos = todos.filter((item) => !item.completed)
    const completedTodos = todos.filter((item) => item.completed)
    const otherItems = filteredItems.filter((item) => item.type !== 'todo')

    // Sort by date (most recent first)
    const sortByDate = (a: Item, b: Item) => {
      if (!a.dateTime && !b.dateTime) return 0
      if (!a.dateTime) return 1
      if (!b.dateTime) return -1
      return b.dateTime - a.dateTime
    }

    return [
      ...incompleteTodos.sort(sortByDate),
      ...otherItems.sort(sortByDate),
      ...completedTodos.sort(sortByDate),
    ]
  }, [filteredItems])

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    )
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="text-4xl mb-4">✨</div>
        <h3 className="text-lg font-medium">This chest is empty</h3>
        {canInteract && (
          <p className="text-muted-foreground">
            Click "Add Item" to add your first digital item.
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Quick Add Todo */}
      {canInteract && <QuickAddTodo chestId={chestId} />}

      {/* Filters and Controls */}
      <div className="space-y-4">
        {/* View Mode and Layout */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <Tabs
            value={viewMode}
            onValueChange={(v) => setViewMode(v as ViewMode)}
          >
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="week">This Week</TabsTrigger>
              <TabsTrigger value="month">This Month</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="todo">Todos</SelectItem>
                <SelectItem value="note">Notes</SelectItem>
                <SelectItem value="link">Links</SelectItem>
                <SelectItem value="image">Images</SelectItem>
                <SelectItem value="file">Files</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant={layoutMode === 'grid' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setLayoutMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={layoutMode === 'list' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setLayoutMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Tag Filters */}
        {allTags.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
              <span>Filter by tags:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-primary/80"
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                  {selectedTags.includes(tag) && <X className="ml-1 h-3 w-3" />}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Active Filters Summary */}
        {(selectedTags.length > 0 ||
          searchQuery ||
          typeFilter !== 'all' ||
          viewMode !== 'all') && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Showing {sortedItems.length} of {items.length} items
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedTags([])
                setSearchQuery('')
                setTypeFilter('all')
                setViewMode('all')
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>

      {/* Items Grid/List */}
      {sortedItems.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">No items match your filters</p>
        </div>
      ) : (
        <div
          className={
            layoutMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
              : 'space-y-3'
          }
        >
          {sortedItems.map((item) => (
            <ItemCard
              key={item._id}
              item={item}
              canInteract={canInteract}
              onEdit={onEditItem}
            />
          ))}
        </div>
      )}
    </div>
  )
}
