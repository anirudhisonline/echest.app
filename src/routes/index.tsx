import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { Authenticated, Unauthenticated, useQuery } from 'convex/react'
import { api } from '@@/convex/_generated/api'
import { SignInForm } from '@/SignInForm'
import { ChestList } from '@/components/ChestList'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler'
import { SignOutButton } from '@/SignOutButton'

export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {
  const navigate = useNavigate()
  const loggedInUser = useQuery(api.auth.loggedInUser)

  // Handle invitation token from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const inviteToken = params.get('invite')

    if (inviteToken && loggedInUser) {
      navigate({ to: '/accept-invite', search: { token: inviteToken } })
    }
  }, [loggedInUser, navigate])

  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <>
      <Authenticated>
        <div className="mx-auto py-8 px-4 mb-4 flex items-center justify-between">
          <div className="flex gap-2 items-center justify-center">
            <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-sm">
              <img src="./logo.png" />
            </div>
            <p className="font-bold">echest</p>
          </div>
          <div className="flex items-center justify-center gap-2">
            <SignOutButton />
            <AnimatedThemeToggler />
          </div>
        </div>
        <div className="container mx-auto py-8 px-4">
          <ChestList
            onSelectChest={(id) =>
              navigate({ to: `/chest/$chestId`, params: { chestId: id } })
            }
          />
        </div>
      </Authenticated>
      <Unauthenticated>
        <SignInForm />
      </Unauthenticated>
    </>
  )
}
