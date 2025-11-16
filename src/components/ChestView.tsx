// src/components/ChestView.tsx - Redesigned with chat-like interface
import { useQuery } from 'convex/react'
import { api } from '@@/convex/_generated/api'
import type { Id } from '@@/convex/_generated/dataModel'
import { useState } from 'react'
import { TodoList } from './TodoList'
import { ContentGrid } from './ContentGrid'
import { ChatInput } from './ChatInput'
import { FilterBar } from './FilterBar'
import { CollaboratorDialog } from './CollaboratorDialog'
import { EditChestDialog } from './EditChestDialog'
import { ItemDialog } from './ItemDialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, Edit } from 'lucide-react'

interface ChestViewProps {
  chestId: Id<'chests'>
}

export function ChestView({ chestId }: ChestViewProps) {
  const chest = useQuery(api.chests.getChest, { chestId })
  const items = useQuery(api.items.getChestItems, { chestId })

  const [showCollaborators, setShowCollaborators] = useState(false)
  const [showEditChest, setShowEditChest] = useState(false)
  const [showEditItem, setShowEditItem] = useState(false)
  const [editingItem, setEditingItem] = useState<any | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'all' | 'today' | 'week' | 'month'>(
    'all',
  )

  if (!chest || !items) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const canEdit = chest.userRole === 'owner' || chest.userRole === 'admin'
  const canAddItems = chest.userRole !== 'viewer'

  // Separate todos from other items
  const todos = items.filter((item) => item.type === 'todo')
  const contentItems = items.filter((item) => item.type !== 'todo')

  const handleEditItem = (item: any) => {
    setEditingItem(item)
    setShowEditItem(true)
  }

  const handleCloseEditItem = () => {
    setShowEditItem(false)
    setEditingItem(null)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="p-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold">{chest.name}</h1>
                <Badge
                  variant={
                    chest.userRole === 'owner'
                      ? 'default'
                      : chest.userRole === 'admin'
                        ? 'secondary'
                        : 'outline'
                  }
                >
                  {chest.userRole}
                </Badge>
              </div>
              {chest.description && (
                <p className="text-sm text-muted-foreground">
                  {chest.description}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              {canEdit && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowEditChest(true)}
                  title="Edit chest"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowCollaborators(true)}
                title="Manage collaborators"
              >
                <Users className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          {/* Filter Bar */}
          <FilterBar
            items={items}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedTags={selectedTags}
            setSelectedTags={setSelectedTags}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            viewMode={viewMode}
            setViewMode={setViewMode}
          />

          {/* Todos Section */}
          {todos.length > 0 && (
            <TodoList
              todos={todos}
              canInteract={canAddItems}
              searchQuery={searchQuery}
              selectedTags={selectedTags}
              viewMode={viewMode}
              onEditTodo={handleEditItem}
            />
          )}

          {/* Content Grid (Notes, Links, Images, Files) */}
          <ContentGrid
            items={contentItems}
            canInteract={canAddItems}
            searchQuery={searchQuery}
            selectedTags={selectedTags}
            typeFilter={typeFilter}
            viewMode={viewMode}
            onEditItem={handleEditItem}
          />
        </div>
      </div>

      {/* Chat Input - Fixed at Bottom */}
      {canAddItems && (
        <div className="border-t bg-card shadow-lg">
          <div className="max-w-5xl mx-auto p-4">
            <ChatInput chestId={chestId} />
          </div>
        </div>
      )}

      {/* Dialogs */}
      <CollaboratorDialog
        chestId={chestId}
        userRole={chest.userRole}
        open={showCollaborators}
        onOpenChange={setShowCollaborators}
      />

      <EditChestDialog
        chestId={chestId}
        currentName={chest.name}
        currentDescription={chest.description}
        open={showEditChest}
        onOpenChange={setShowEditChest}
      />

      <ItemDialog
        chestId={chestId}
        item={editingItem}
        open={showEditItem}
        onOpenChange={handleCloseEditItem}
      />
    </div>
  )
}
