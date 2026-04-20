import dynamic from 'next/dynamic'

const AuthCallback = dynamic(() => import('./AuthCallbackClient'), { ssr: false })

export default function AuthCallbackPage() {
  return <AuthCallback />
}
