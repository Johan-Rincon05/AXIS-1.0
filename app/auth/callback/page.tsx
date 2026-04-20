'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Callback placeholder — Google OAuth pendiente de Fase 3
export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/')
  }, [router])

  return null
}
