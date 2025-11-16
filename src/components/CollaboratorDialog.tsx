// src/components/CollaboratorDialog.tsx
import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@@/convex/_generated/api'
import type { Id } from '@@/convex/_generated/dataModel'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { UserPlus, Trash2, Copy, Check } from 'lucide-react'

interface CollaboratorDialogProps {
  chestId: Id<'chests'>
  userRole: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CollaboratorDialog({
  chestId,
  userRole,
  open,
  onOpenChange,
}: CollaboratorDialogProps) {
  const collaborators = useQuery(api.chests.getCollaborators, { chestId })
  const inviteUser = useMutation(api.chests.inviteUser)
  const removeCollaborator = useMutation(api.chests.removeCollaborator)

  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'editor' | 'viewer'>(
    'editor',
  )
  const [isInviting, setIsInviting] = useState(false)
  const [copiedToken, setCopiedToken] = useState(false)

  const canManage = userRole === 'owner' || userRole === 'admin'

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return

    setIsInviting(true)
    try {
      const token = await inviteUser({
        chestId,
        email: inviteEmail.trim(),
        role: inviteRole,
      })

      const inviteLink = `${window.location.origin}/accept-invite?token=${token}`
      await navigator.clipboard.writeText(inviteLink)

      setCopiedToken(true)
      setTimeout(() => setCopiedToken(false), 2000)

      toast.success(`Invite link copied to clipboard! for ${inviteEmail}`, {
        description: '',
      })
      setInviteEmail('')
      setShowInviteForm(false)
    } catch (error: any) {
      toast.error(error.message || 'Failed to create invite')
    } finally {
      setIsInviting(false)
    }
  }

  const handleRemove = async (userId: Id<'users'>, userName: string) => {
    try {
      await removeCollaborator({ chestId, userId })
      toast.success(`Removed ${userName}`)
    } catch (error) {
      toast.error('Failed to remove collaborator')
    }
  }

  if (!collaborators) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Collaborators</DialogTitle>
          <DialogDescription>
            View and manage who has access to this chest
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Owner */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Owner</h4>
            <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg border">
              <div className="flex-1">
                <p className="font-medium">
                  {collaborators.owner.name || collaborators.owner.email}
                </p>
                <p className="text-sm text-muted-foreground">
                  {collaborators.owner.email}
                </p>
              </div>
              <Badge>Owner</Badge>
            </div>
          </div>

          {/* Collaborators */}
          {collaborators.collaborators.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Team Members</h4>
                <div className="space-y-2">
                  {collaborators.collaborators.map((collaborator) =>
                    collaborator ? (
                      <div
                        key={collaborator._id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div className="flex-1">
                          <p className="font-medium">
                            {collaborator.name || collaborator.email}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {collaborator.email}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              collaborator.role === 'admin'
                                ? 'secondary'
                                : collaborator.role === 'editor'
                                  ? 'default'
                                  : 'outline'
                            }
                          >
                            {collaborator.role}
                          </Badge>
                          {canManage && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() =>
                                handleRemove(
                                  collaborator._id,
                                  collaborator.name ||
                                    collaborator.email ||
                                    'User',
                                )
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ) : null,
                  )}
                </div>
              </div>
            </>
          )}

          {/* Invite Section */}
          {canManage && (
            <>
              <Separator />
              <div className="space-y-4">
                {showInviteForm ? (
                  <form onSubmit={handleInvite} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="colleague@example.com"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select
                        value={inviteRole}
                        onValueChange={(value: any) => setInviteRole(value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="viewer">
                            Viewer (read-only)
                          </SelectItem>
                          <SelectItem value="editor">
                            Editor (can add/edit items)
                          </SelectItem>
                          <SelectItem value="admin">
                            Admin (can manage collaborators)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={isInviting}
                        className="flex-1"
                      >
                        {copiedToken ? (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Link Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="mr-2 h-4 w-4" />
                            {isInviting ? 'Creating...' : 'Create Invite Link'}
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowInviteForm(false)
                          setInviteEmail('')
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <Button
                    onClick={() => setShowInviteForm(true)}
                    className="w-full"
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invite Collaborator
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
