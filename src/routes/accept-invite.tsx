// src/routes/accept-invite.tsx
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Authenticated, useMutation, useQuery } from 'convex/react'
import { api } from '@@/convex/_generated/api'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { toast } from 'sonner'
import { useState } from 'react'

export const Route = createFileRoute('/accept-invite')({
  component: AcceptInvite,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      token: (search.token as string) || '',
    }
  },
})

function AcceptInvite() {
  const { token } = Route.useSearch()
  const navigate = useNavigate()
  const acceptInvite = useMutation(api.chests.acceptInvite)
  const loggedInUser = useQuery(api.auth.loggedInUser)
  const [isAccepting, setIsAccepting] = useState(false)

  const handleAcceptInvite = async () => {
    if (!token) {
      toast.error('Invalid invite link')
      return
    }

    setIsAccepting(true)
    try {
      const chestId = await acceptInvite({ token })
      toast.success('Successfully joined the chest!')
      setTimeout(() => {
        navigate({ to: `/chest/$chestId`, params: { chestId } })
      }, 1000)
    } catch (error: any) {
      toast.error(error.message || 'Failed to accept invite')
      setIsAccepting(false)
    }
  }

  // Loading state - waiting for auth
  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Not signed in
  if (!loggedInUser) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Sign in to accept invite</CardTitle>
            <CardDescription>
              You need to be signed in to accept this chest invitation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              After signing in, you'll be able to accept the invitation and
              access the shared chest.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Signed in - show accept button
  return (
    <Authenticated>
      <div className="container mx-auto py-8 px-4 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Accept Chest Invitation</CardTitle>
            <CardDescription>
              You've been invited to collaborate on a chest
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Click the button below to accept the invitation and gain access to
              the shared chest.
            </p>
            <div className="flex gap-2">
              <Button
                onClick={handleAcceptInvite}
                disabled={isAccepting}
                className="flex-1"
              >
                {isAccepting ? 'Accepting...' : 'Accept Invitation'}
              </Button>
              <Button variant="outline" onClick={() => navigate({ to: '/' })}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Authenticated>
  )
}
