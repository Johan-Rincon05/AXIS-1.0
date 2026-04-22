import { LinearMetrica } from '@/types'

const LINEAR_API_KEY = process.env.LINEAR_API_KEY

interface LinearIssue {
  state: { type: string }
  assignee?: { email: string }
}

export async function getLinearMetricsByEmail(): Promise<Record<string, LinearMetrica>> {
  if (!LINEAR_API_KEY) {
    console.warn('LINEAR_API_KEY no está configurada')
    return {}
  }

  // Consulta GraphQL para traer los issues que NO estén cancelados
  const query = `
    query {
      issues(filter: { state: { type: { neq: "canceled" } } }) {
        nodes {
          state { type }
          assignee { email }
        }
      }
    }
  `

  try {
    const res = await fetch('https://api.linear.app/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': LINEAR_API_KEY
      },
      body: JSON.stringify({ query }),
      next: { revalidate: 300 } // Cachear por 5 minutos para no saturar la API
    })

    if (!res.ok) throw new Error('Error conectando a Linear')
    
    const json = await res.json()
    const issues: LinearIssue[] = json.data?.issues?.nodes || []

    const metricsMap: Record<string, LinearMetrica> = {}

    // Agrupar por correo electrónico
    for (const issue of issues) {
      if (!issue.assignee?.email) continue
      
      const email = issue.assignee.email.toLowerCase()
      if (!metricsMap[email]) {
        metricsMap[email] = { totalAsignadas: 0, completadas: 0, enProgreso: 0, porcentaje: 100 }
      }

      metricsMap[email].totalAsignadas++
      
      if (issue.state.type === 'completed') {
        metricsMap[email].completadas++
      } else {
        metricsMap[email].enProgreso++
      }
    }

    // Calcular porcentajes
    for (const email in metricsMap) {
      const m = metricsMap[email]
      m.porcentaje = m.totalAsignadas > 0 
        ? Math.round((m.completadas / m.totalAsignadas) * 100) 
        : 100
    }

    return metricsMap

  } catch (error) {
    console.error('Error en getLinearMetricsByEmail:', error)
    return {}
  }
}
