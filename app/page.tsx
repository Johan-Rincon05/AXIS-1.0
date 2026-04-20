import dynamic from 'next/dynamic'

// SPA pura — deshabilitar SSR para evitar errores de hooks en prerender
const App = dynamic(() => import('../App'), { ssr: false })

export default function Page() {
  return <App />
}
