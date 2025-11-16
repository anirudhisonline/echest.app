'use client'

import { useAuthActions } from '@convex-dev/auth/react'
import { Github } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler'

/**
 * Simplified authentication component with only GitHub and Anonymous sign-in
 */
function AuthForm() {
  const { signIn } = useAuthActions()
  const [submitting, setSubmitting] = useState(false)

  const handleGitHubSignIn = () => {
    setSubmitting(true)
    void signIn('github')
  }

  const handleAnonymousSignIn = () => {
    setSubmitting(true)
    void signIn('anonymous')
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Form Header */}
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-2xl font-bold">Sign in to your account</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Choose your preferred sign-in method to continue.
        </p>
      </div>

      {/* Sign-in Options */}
      <div className="grid gap-4">
        <Button
          type="button"
          disabled={submitting}
          onClick={handleGitHubSignIn}
          className="w-full"
        >
          <Github className="mr-2 h-4 w-4" />
          Sign in with GitHub
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or</span>
          </div>
        </div>

        <Button
          variant="outline"
          type="button"
          disabled={submitting}
          onClick={handleAnonymousSignIn}
          className="w-full"
        >
          Sign in anonymously
        </Button>
      </div>
    </div>
  )
}

/**
 * Main sign-in page component with two-column layout
 */
export function SignInForm() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-between w-full">
          <a href="" className="flex items-center gap-2 font-medium">
            <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-sm">
              <img src="./logo.png" alt="Logo" />
            </div>
            <p>echest</p>
          </a>
          <AnimatedThemeToggler />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">
            <AuthForm />
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <img
          src="./echestgrad.png"
          alt="A beautiful descriptive image for the login page"
          width="1920"
          height="1080"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.7]"
        />
      </div>
    </div>
  )
}
