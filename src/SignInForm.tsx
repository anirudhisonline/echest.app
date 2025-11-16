'use client'

import { useAuthActions } from '@convex-dev/auth/react'
import { Inbox } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler'

/**
 * This component contains the authentication form logic, adapted to fit the template's style.
 */
function AuthForm() {
  const { signIn } = useAuthActions()
  const [flow, setFlow] = useState<'signIn' | 'signUp'>('signIn')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    const formData = new FormData(event.target as HTMLFormElement)
    formData.set('flow', flow)
    signIn('password', formData).catch((error) => {
      let toastTitle = ''
      if (error.message.includes('Invalid password')) {
        toastTitle = 'Invalid password. Please try again.'
      } else {
        toastTitle =
          flow === 'signIn'
            ? 'Could not sign in, did you mean to sign up?'
            : 'Could not sign up, did you mean to sign in?'
      }
      toast.error(toastTitle)
      setSubmitting(false)
    })
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
      {/* Form Header */}
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-2xl font-bold">
          {flow === 'signIn' ? 'Sign in to your account' : 'Create an account'}
        </h1>
        <p className="text-muted-foreground text-sm text-balance">
          {flow === 'signIn'
            ? 'Enter your credentials to access your account.'
            : 'Enter your email and password to get started.'}
        </p>
      </div>

      {/* Form Fields */}
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="m@example.com"
            required
            disabled={submitting}
          />
        </div>
        <div className="grid gap-2">
          <div className="flex items-center">
            <Label htmlFor="password">Password</Label>
            {flow === 'signIn' && (
              <a
                href="#"
                className="ml-auto text-sm underline-offset-4 hover:underline"
              >
                Forgot your password?
              </a>
            )}
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            required
            disabled={submitting}
          />
        </div>
        <Button type="submit" disabled={submitting}>
          {flow === 'signIn' ? 'Sign In' : 'Sign Up'}
        </Button>
      </div>

      {/* Separator and Anonymous Sign-in */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      <Button
        variant="outline"
        type="button"
        disabled={submitting}
        onClick={() => signIn('anonymous')}
      >
        Sign in anonymously
      </Button>

      {/* Toggle between Sign In / Sign Up */}
      <div className="mt-4 text-center text-sm">
        {flow === 'signIn'
          ? "Don't have an account? "
          : 'Already have an account? '}
        <button
          type="button"
          className="underline underline-offset-4 hover:text-primary"
          onClick={() => setFlow(flow === 'signIn' ? 'signUp' : 'signIn')}
        >
          {flow === 'signIn' ? 'Sign up' : 'Sign in'}
        </button>
      </div>
    </form>
  )
}

/**
 * This is the main page component, using the two-column layout from the template.
 */
export function SignInForm() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-between w-full ">
          <a href="" className="flex items-center gap-2 font-medium">
            <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-sm">
              <img src="./logo.png" />
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
