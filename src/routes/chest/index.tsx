import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/chest/')({
  beforeLoad: () => {
    throw redirect({
      to: '/',
    })
  },
})
