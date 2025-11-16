// src/components/ChestView.tsx - Simplified, no header
import { useQuery } from 'convex/react'
import { api } from '@@/convex/_generated/api'
import type { Id } from '@@/convex/_generated/dataModel'
import { useState } from 'react'
import { TodoList } from './TodoList'
import { ContentGrid } from './ContentGrid'
import { ChatInput } from './ChatInput'
import { FilterBar } from './FilterBar'
import { QuickAddTodo } from './QuickAddTodo'
import { CollaboratorDialog } from './CollaboratorDialog'
import { EditChestDialog } from './EditChestDialog'
import { ItemDialog } from './ItemDialog'

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
    <>
      {/* Main Scrollable Content - Full Height */}
      <div className="flex-1 overflow-y-auto pb-32">
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

          {/* Quick Add Todo */}
          {canAddItems && <QuickAddTodo chestId={chestId} />}

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

      {/* Chat Input - Fixed at Bottom (Floating) */}
      {canAddItems && (
        <div className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-lg z-30">
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
    </>
  )
}
