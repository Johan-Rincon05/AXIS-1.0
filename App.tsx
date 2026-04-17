'use client'

import { useState, useCallback } from 'react'
import { Role } from '@/types'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { TicketsProvider } from '@/contexts/TicketsContext'
import { UsersProvider } from '@/contexts/UsersContext'
import { AppShell } from '@/components/layout/AppShell'
import { LoginScreen } from '@/features/auth/components/LoginScreen'
import { userServiceClient } from '@/services/userService'

function AppContent() {
  const { currentUser, login } = useAuth()

  const [codeSent, setCodeSent] = useState(false)
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [showRoleSelection, setShowRoleSelection] = useState(false)

  const handleSendCode = useCallback(async (email: string) => {
    setIsSendingCode(true)
    setLoginError('')
    try {
      const res = await fetch('/api/email/send-code', {
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
      const res = await fetch('/api/email/verify-code', {
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
    setShowRoleSelection(true)
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
