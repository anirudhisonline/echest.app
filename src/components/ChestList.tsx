// src/components/ChestList.tsx
import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { Link } from '@tanstack/react-router'
import { api } from '@@/convex/_generated/api'
import type { Id } from '@@/convex/_generated/dataModel'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Trash2, Plus } from 'lucide-react'

export function ChestList() {
  const chests = useQuery(api.chests.listMyChests)
  const createChest = useMutation(api.chests.createChest)
  const deleteChest = useMutation(api.chests.deleteChest)

  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newChestName, setNewChestName] = useState('')
  const [newChestDescription, setNewChestDescription] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [deleteChestId, setDeleteChestId] = useState<Id<'chests'> | null>(null)
  const [deleteChestName, setDeleteChestName] = useState('')

  const handleCreateChest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newChestName.trim()) return

    setIsCreating(true)
    try {
      await createChest({
        name: newChestName.trim(),
        description: newChestDescription.trim() || undefined,
      })

      setNewChestName('')
      setNewChestDescription('')
      setShowCreateDialog(false)
      toast.success('Chest created successfully!')
    } catch (error) {
      toast.error('Failed to create chest')
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteChest = async () => {
    if (!deleteChestId) return

    try {
      await deleteChest({ chestId: deleteChestId })
      toast.success('Chest deleted successfully')
      setDeleteChestId(null)
      setDeleteChestName('')
    } catch (error) {
      toast.error('Failed to delete chest')
    }
  }

  if (!chests) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    )
  }

  const allChests = [...chests.owned, ...chests.shared]

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold tracking-tight">Your Chests</h2>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create New Chest
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Chest</DialogTitle>
              <DialogDescription>
                Add a new chest to organize your digital items
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateChest}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="chest-name">Chest Name</Label>
                  <Input
                    id="chest-name"
                    value={newChestName}
                    onChange={(e) => setNewChestName(e.target.value)}
                    placeholder="Enter chest name..."
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="chest-description">
                    Description (optional)
                  </Label>
                  <Textarea
                    id="chest-description"
                    value={newChestDescription}
                    onChange={(e) => setNewChestDescription(e.target.value)}
                    placeholder="Describe your chest..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isCreating || !newChestName.trim()}
                >
                  {isCreating ? 'Creating...' : 'Create Chest'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {allChests.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-lg font-medium mb-2">No chests yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first chest to start organizing your digital items
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Chest
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allChests.map(
            (chest) =>
              chest && (
                <Link
                  key={chest._id}
                  to="/chest/$chestId"
                  params={{ chestId: chest._id }}
                >
                  <Card className="cursor-pointer hover:border-primary transition-colors h-full">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="truncate pr-2">
                          {chest.name}
                        </CardTitle>
                        <Badge
                          variant={
                            chest.role === 'owner'
                              ? 'default'
                              : chest.role === 'admin'
                                ? 'secondary'
                                : 'outline'
                          }
                        >
                          {chest.role}
                        </Badge>
                      </div>
                      {chest.description && (
                        <CardDescription className="line-clamp-2 pt-1">
                          {chest.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardFooter className="flex justify-end">
                      {chest.role === 'owner' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          title="Delete chest"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setDeleteChestId(chest._id)
                            setDeleteChestName(chest.name)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                </Link>
              ),
          )}
        </div>
      )}

      <AlertDialog
        open={!!deleteChestId}
        onOpenChange={(open) => !open && setDeleteChestId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deleteChestName}" and all its
              items. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteChest}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
