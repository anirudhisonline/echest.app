// src/routes/chest.$chestId.tsx
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { Authenticated, useQuery } from 'convex/react'
import { api } from '@@/convex/_generated/api'
import { ChestView } from '@/components/ChestView'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Users, Edit } from 'lucide-react'
import type { Id } from '@@/convex/_generated/dataModel'
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler'
import { SignOutButton } from '@/SignOutButton'
import { useState } from 'react'
import { CollaboratorDialog } from '@/components/CollaboratorDialog'
import { EditChestDialog } from '@/components/EditChestDialog'

export const Route = createFileRoute('/chest/$chestId/')({
  component: ChestPage,
  errorComponent: ({ error }) => (
    <div className="container mx-auto py-8 px-4">
      <div className="text-center max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-2">Chest not found</h1>
        <p className="text-muted-foreground mb-6">
          This chest doesn't exist or you don't have access to it.
        </p>
        <Button onClick={() => (window.location.href = '/')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Chests
        </Button>
      </div>
    </div>
  ),
})

function ChestPage() {
  const { chestId } = Route.useParams()
  const navigate = useNavigate()
  const chest = useQuery(api.chests.getChest, {
    chestId: chestId as Id<'chests'>,
  })

  const [showCollaborators, setShowCollaborators] = useState(false)
  const [showEditChest, setShowEditChest] = useState(false)

  // Loading state
  if (chest === undefined) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const canEdit = chest.userRole === 'owner' || chest.userRole === 'admin'

  return (
    <Authenticated>
      <div className="min-h-screen flex flex-col">
        {/* Sticky Top Bar - Responsive Layout */}
        <div className="border-b bg-background sticky top-0 z-40 shadow-sm">
          <div className="px-6 py-3">
            {/* Desktop: Everything in one line */}
            <div className="hidden md:flex items-center justify-between gap-6">
              {/* Left Side: Logo + Chest Info */}
              <div className="flex items-center gap-4 flex-1 min-w-0">
                {/* Logo */}
                <Link
                  to="/"
                  className="flex items-center gap-2 font-medium hover:opacity-80 transition-opacity shrink-0"
                >
                  <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-sm">
                    <img src="../logo.png" alt="echest" />
                  </div>
                  <p className="font-bold">echest</p>
                </Link>

                {/* Divider */}
                <div className="h-6 w-px bg-border shrink-0" />

                {/* Chest Name & Description */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg font-semibold truncate">
                      {chest.name}
                    </h1>
                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={() => setShowEditChest(true)}
                        title="Edit chest"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  {chest.description && (
                    <p className="text-xs text-muted-foreground truncate">
                      {chest.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Right Side: Role + Collaborators + Sign Out + Theme */}
              <div className="flex items-center gap-3 shrink-0">
                {/* Role Badge */}
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

                {/* Collaborators Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCollaborators(true)}
                >
                  <Users className="h-4 w-4 mr-2" />
                </Button>

                {/* Divider */}
                <div className="h-6 w-px bg-border" />

                {/* Sign Out & Theme */}
                <SignOutButton />
                <AnimatedThemeToggler />
              </div>
            </div>

            {/* Mobile: Two lines */}
            <div className="md:hidden space-y-3">
              {/* Line 1: Logo + echest + Sign Out + Theme */}
              <div className="flex items-center justify-between">
                <Link
                  to="/"
                  className="flex items-center gap-2 font-medium hover:opacity-80 transition-opacity"
                >
                  <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-sm">
                    <img src="../logo.png" alt="echest" />
                  </div>
                  <p className="font-bold">echest</p>
                </Link>

                <div className="flex items-center gap-2">
                  <SignOutButton />
                  <AnimatedThemeToggler />
                </div>
              </div>

              {/* Line 2: Chest Name + Collaborators Icon */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg font-semibold truncate">
                      {chest.name}
                    </h1>
                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={() => setShowEditChest(true)}
                        title="Edit chest"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  {chest.description && (
                    <p className="text-xs text-muted-foreground truncate">
                      {chest.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
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
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowCollaborators(true)}
                  >
                    <Users className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Full Height Scrollable */}
        <ChestView chestId={chestId as Id<'chests'>} />

        {/* Dialogs */}
        <CollaboratorDialog
          chestId={chestId as Id<'chests'>}
          userRole={chest.userRole}
          open={showCollaborators}
          onOpenChange={setShowCollaborators}
        />

        <EditChestDialog
          chestId={chestId as Id<'chests'>}
          currentName={chest.name}
          currentDescription={chest.description}
          open={showEditChest}
          onOpenChange={setShowEditChest}
        />
      </div>
    </Authenticated>
  )
}
