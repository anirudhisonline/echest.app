// src/components/CollaboratorPanel.tsx
import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@@/convex/_generated/api'
import type { Id } from '@@/convex/_generated/dataModel'
import { toast } from 'sonner'

interface CollaboratorPanelProps {
  chestId: Id<'chests'>
  userRole: string
  onClose: () => void
}

export function CollaboratorPanel({
  chestId,
  userRole,
  onClose,
}: CollaboratorPanelProps) {
  const collaborators = useQuery(api.chests.getCollaborators, { chestId })
  const inviteUser = useMutation(api.chests.inviteUser)
  const removeCollaborator = useMutation(api.chests.removeCollaborator)

  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'editor' | 'viewer'>(
    'editor',
  )
  const [isInviting, setIsInviting] = useState(false)

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

      // Create invite link
      const inviteLink = `${window.location.origin}?invite=${token}`

      // Copy to clipboard
      await navigator.clipboard.writeText(inviteLink)

      toast.success('Invite link copied to clipboard!')
      setInviteEmail('')
      setShowInviteForm(false)
    } catch (error: any) {
      toast.error(error.message || 'Failed to create invite')
    } finally {
      setIsInviting(false)
    }
  }

  const handleRemove = async (userId: Id<'users'>, userName: string) => {
    if (!confirm(`Remove ${userName} from this chest?`)) return

    try {
      await removeCollaborator({ chestId, userId })
      toast.success('Collaborator removed')
    } catch (error) {
      toast.error('Failed to remove collaborator')
    }
  }

  if (!collaborators) {
    return (
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <div className="flex justify-center items-center h-20">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Collaborators</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          ×
        </button>
      </div>

      {/* Owner */}
      <div className="mb-4">
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
          <div>
            <div className="font-medium">
              {collaborators.owner.name || collaborators.owner.email}
            </div>
            <div className="text-sm text-gray-600">
              {collaborators.owner.email}
            </div>
          </div>
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
            Owner
          </span>
        </div>
      </div>

      {/* Collaborators */}
      {collaborators.collaborators.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Team Members
          </h4>
          <div className="space-y-2">
            {collaborators.collaborators.map(
              (collaborator) =>
                collaborator && (
                  <div
                    key={collaborator._id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <div className="font-medium">
                        {collaborator.name || collaborator.email}
                      </div>
                      <div className="text-sm text-gray-600">
                        {collaborator.email}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          collaborator.role === 'admin'
                            ? 'bg-purple-100 text-purple-800'
                            : collaborator.role === 'editor'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {collaborator.role}
                      </span>
                      {canManage && (
                        <button
                          onClick={() =>
                            handleRemove(
                              collaborator._id,
                              collaborator.name || collaborator.email || 'User',
                            )
                          }
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Remove collaborator"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                ),
            )}
          </div>
        </div>
      )}

      {/* Invite Form */}
      {canManage && (
        <div>
          {showInviteForm ? (
            <form onSubmit={handleInvite} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="colleague@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="viewer">Viewer (read-only)</option>
                  <option value="editor">Editor (can add/edit items)</option>
                  <option value="admin">
                    Admin (can manage collaborators)
                  </option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isInviting}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover disabled:opacity-50"
                >
                  {isInviting ? 'Creating...' : 'Create Invite Link'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowInviteForm(false)
                    setInviteEmail('')
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowInviteForm(true)}
              className="w-full px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover"
            >
              Invite Collaborator
            </button>
          )}
        </div>
      )}
    </div>
  )
}
