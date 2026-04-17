'use client'

import { useState } from 'react'
import { Role } from '@/types'

interface LoginScreenProps {
  onSendCode: (email: string) => Promise<void>
  onVerifyCode: (email: string, code: string) => Promise<void>
  onGoogleLogin: () => void
  onSelectRole: (role: Role) => void
  showRoleSelection: boolean
  setShowRoleSelection: (v: boolean) => void
  loginError: string
  isSendingCode: boolean
  codeSent: boolean
}

export function LoginScreen({
  onSendCode, onVerifyCode, onGoogleLogin, onSelectRole,
  showRoleSelection, setShowRoleSelection,
  loginError, isSendingCode, codeSent,
}: LoginScreenProps) {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'email' | 'code'>('email')

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSendCode(email)
    if (!loginError) setStep('code')
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    await onVerifyCode(email, code)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-zinc-900 to-slate-800">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 mb-4 shadow-2xl shadow-violet-500/30">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">AXIS</h1>
          <p className="text-zinc-400 text-sm mt-1">Sistema Integrado de Gestión</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-700/60 rounded-2xl p-8 shadow-2xl">
          {showRoleSelection ? (
            <div className="space-y-3">
              <h2 className="text-white font-semibold text-lg mb-4">Seleccionar rol de prueba</h2>
              {Object.values(Role).map((role) => (
                <button
                  key={role}
                  onClick={() => onSelectRole(role)}
                  className="w-full px-4 py-3 rounded-xl text-left text-sm font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700 hover:border-zinc-500 transition-all"
                >
                  {role}
                </button>
              ))}
              <button
                onClick={() => setShowRoleSelection(false)}
                className="w-full mt-2 py-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Volver
              </button>
            </div>
          ) : step === 'email' ? (
            <form onSubmit={handleSendCode} className="space-y-5">
              <div>
                <h2 className="text-white font-bold text-xl">Bienvenido de nuevo</h2>
                <p className="text-zinc-400 text-sm mt-1">Ingresa tu correo para continuar</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  Correo institucional
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={isSendingCode}
                  placeholder="tu@empresa.com"
                  className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                />
              </div>

              {loginError && (
                <p className="text-sm text-red-400 bg-red-950/40 border border-red-800/50 rounded-lg px-3 py-2">{loginError}</p>
              )}
              {codeSent && !loginError && (
                <p className="text-sm text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 rounded-lg px-3 py-2">
                  Código enviado a tu correo.
                </p>
              )}

              <button
                type="submit"
                disabled={isSendingCode}
                className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSendingCode ? (
                  <>
                    <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Enviando…
                  </>
                ) : 'Enviar código de verificación'}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-700" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3 bg-zinc-900 text-xs text-zinc-500">o continúa con</span>
                </div>
              </div>

              <button
                type="button"
                onClick={onGoogleLogin}
                className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-zinc-800 border border-zinc-700 hover:border-zinc-500 hover:bg-zinc-750 text-white text-sm font-medium transition-all"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-5">
              <div>
                <h2 className="text-white font-bold text-xl">Verificar identidad</h2>
                <p className="text-zinc-400 text-sm mt-1">
                  Código enviado a <span className="text-zinc-200">{email}</span>
                </p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  Código de 6 dígitos
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-full px-4 py-4 rounded-xl bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-center text-2xl tracking-[0.5em] font-mono"
                />
              </div>

              {loginError && (
                <p className="text-sm text-red-400 bg-red-950/40 border border-red-800/50 rounded-lg px-3 py-2">{loginError}</p>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 transition-all shadow-lg shadow-blue-500/20"
              >
                Verificar y entrar
              </button>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setStep('email'); setCode('') }}
                  className="flex-1 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  Cambiar correo
                </button>
                <button
                  type="button"
                  onClick={() => onSendCode(email)}
                  className="flex-1 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  Reenviar código
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
