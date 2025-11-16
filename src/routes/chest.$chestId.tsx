// src/routes/chest.$chestId.tsx
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { Authenticated, useQuery } from 'convex/react'
import { api } from '@@/convex/_generated/api'
import { ChestView } from '@/components/ChestView'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import type { Id } from '@@/convex/_generated/dataModel'
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler'
import { SignOutButton } from '@/SignOutButton'

export const Route = createFileRoute('/chest/$chestId')({
  component: ChestPage,
})

function ChestPage() {
  const { chestId } = Route.useParams()
  const navigate = useNavigate()
  const chest = useQuery(api.chests.getChest, {
    chestId: chestId as Id<'chests'>,
  })

  if (chest === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (chest === null) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Chest not found</h1>
          <Button onClick={() => navigate({ to: '/' })}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Chests
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Authenticated>
      <div className="container">
        <div className="mb-4 flex items-center justify-between mx-auto py-8 px-4">
          <Link to="/" className="flex items-center gap-2 font-medium">
            <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-sm">
              <img src="../logo.png" />
            </div>
            <p className="font-bold">echest</p>
          </Link>
          <div className="flex items-center justify-center gap-2">
            <SignOutButton />
            <AnimatedThemeToggler />
          </div>
        </div>
        <ChestView chestId={chestId as Id<'chests'>} />
      </div>
    </Authenticated>
  )
}
