// src/components/EditChestDialog.tsx
import { useState, useEffect } from 'react'
import { useMutation } from 'convex/react'
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

interface EditChestDialogProps {
  chestId: Id<'chests'>
  currentName: string
  currentDescription?: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditChestDialog({
  chestId,
  currentName,
  currentDescription,
  open,
  onOpenChange,
}: EditChestDialogProps) {
  const updateChest = useMutation(api.chests.updateChest)
  const [name, setName] = useState(currentName)
  const [description, setDescription] = useState(currentDescription || '')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setName(currentName)
    setDescription(currentDescription || '')
  }, [currentName, currentDescription, open])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsSaving(true)
    try {
      await updateChest({
        chestId,
        name: name.trim(),
        description: description.trim() || undefined,
      })
      toast.success('Chest updated successfully')
      onOpenChange(false)
    } catch (error) {
      toast.error('Failed to update chest')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Chest</DialogTitle>
          <DialogDescription>
            Update the name and description of your chest
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSave}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Chest Name</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter chest name..."
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description (optional)</Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your chest..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving || !name.trim()}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
