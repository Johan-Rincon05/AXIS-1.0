'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Role, Area, MetricasTecnico } from '@/types'

export function useSLA(area?: Area) {
  const { currentUser } = useAuth()
  
  const [metricas, setMetricas] = useState<MetricasTecnico[]>([])
  const [currentUserMetrica, setCurrentUserMetrica] = useState<MetricasTecnico | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let url = '/api/sla?'
    if (area) url += `area=${area}&`
    if (currentUser) {
      url += `userId=${currentUser.id}&userName=${encodeURIComponent(currentUser.name)}&email=${encodeURIComponent(currentUser.email)}&userArea=${currentUser.area || 'DTI'}`
    }

    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data.metricas) setMetricas(data.metricas)
        if (data.currentUserMetrica) setCurrentUserMetrica(data.currentUserMetrica)
        setIsLoading(false)
      })
      .catch(err => {
        console.error('Error fetching SLA:', err)
        setIsLoading(false)
      })
  }, [area, currentUser])

  const isStaff = currentUser?.role !== Role.EMPLEADO

  return { metricas, currentUserMetrica, isStaff, isLoading }
}
