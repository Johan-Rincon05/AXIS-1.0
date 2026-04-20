'use client'

import { useState, useCallback, useEffect } from 'react'
import { Role } from '@/types'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { TicketsProvider } from '@/contexts/TicketsContext'
import { UsersProvider } from '@/contexts/UsersContext'
import { AppShell } from '@/components/layout/AppShell'
import { LoginScreen } from '@/features/auth/components/LoginScreen'
import { userServiceClient } from '@/services/userServiceClient'

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  user_not_found: 'El correo de Google no está registrado en el sistema.',
  user_inactive: 'Tu cuenta está inactiva. Contacta al administrador.',
  token_failed: 'Error al autenticar con Google. Intenta de nuevo.',
  oauth_failed: 'Error de autenticación. Intenta de nuevo.',
  no_email: 'No se pudo obtener el correo de Google.',
}

function AppContent() {
  const { currentUser, login } = useAuth()

  const [codeSent, setCodeSent] = useState(false)
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [showRoleSelection, setShowRoleSelection] = useState(false)

  // Manejar redirect de Google OAuth
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const googleUserId = params.get('google_user_id')
    const authError = params.get('auth_error')

    if (authError) {
      setLoginError(AUTH_ERROR_MESSAGES[authError] || 'Error al iniciar sesión con Google.')
      window.history.replaceState({}, '', '/')
    }

    if (googleUserId) {
      window.history.replaceState({}, '', '/')
      userServiceClient.getUserById(googleUserId).then(user => {
        if (user) login(user)
        else setLoginError('Usuario no encontrado.')
      }).catch(() => setLoginError('Error al cargar el usuario.'))
    }
  }, [])

  const handleSendCode = useCallback(async (email: string) => {
    setIsSendingCode(true)
    setLoginError('')
    try {
      const res = await fetch('/api/auth/send-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) throw new Error('No se pudo enviar el código')
      setCodeSent(true)
    } catch (err: any) {
      setLoginError(err.message || 'Error al enviar el código')
    } finally {
      setIsSendingCode(false)
    }
  }, [])

  const handleVerifyCode = useCallback(async (email: string, code: string) => {
    setLoginError('')
    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      })
      if (!res.ok) throw new Error('Código inválido o expirado')
      const users = await userServiceClient.getAllUsers()
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase())
      if (!user) throw new Error('Usuario no registrado en el sistema')
      login(user)
    } catch (err: any) {
      setLoginError(err.message || 'Error al verificar el código')
    }
  }, [login])

  const handleGoogleLogin = useCallback(() => {
    window.location.href = '/api/auth/google'
  }, [])

  const handleSelectRole = useCallback(async (role: Role) => {
    try {
      const users = await userServiceClient.getAllUsers()
      const demo = users.find(u => u.role === role)
      if (demo) {
        login(demo)
      } else {
        setLoginError(`No hay usuario demo con rol ${role}`)
      }
    } catch {
      setLoginError('Error al cargar usuarios')
    }
    setShowRoleSelection(false)
  }, [login])

  if (!currentUser) {
    return (
      <LoginScreen
        onSendCode={handleSendCode}
        onVerifyCode={handleVerifyCode}
        onGoogleLogin={handleGoogleLogin}
        onSelectRole={handleSelectRole}
        showRoleSelection={showRoleSelection}
        setShowRoleSelection={setShowRoleSelection}
        loginError={loginError}
        isSendingCode={isSendingCode}
        codeSent={codeSent}
      />
    )
  }

  return (
    <TicketsProvider>
      <UsersProvider>
        <AppShell />
      </UsersProvider>
    </TicketsProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
