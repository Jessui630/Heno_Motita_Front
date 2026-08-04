import { useEffect, useState } from 'react'
import { ApiError } from '../api/httpClient'
import { getManagerDashboard, getStudentProfile, listStudentPortalObservations, listStudentPortalTrees } from '../api/portalApi'
import type { User } from '../types/auth.types'

interface PortalDashboardProps { accessToken: string; user: User; onUnauthorized: () => void }

function PortalDashboard({ accessToken, user, onUnauthorized }: PortalDashboardProps) {
  const [content, setContent] = useState<React.ReactNode>(null)

  useEffect(() => {
    async function load() {
      try {
        if (user.role === 'CREW_MANAGER') {
          const data = await getManagerDashboard(accessToken)
          setContent(<section className="portal-panel"><p className="eyebrow">Panel de encargado</p><h2>Resumen de cuadrillas</h2><div className="metrics"><Metric label="Asignadas" value={data.summary.assignedCrews} /><Metric label="Activas" value={data.summary.activeCrews} /><Metric label="Pendientes" value={data.summary.pendingCrews} /><Metric label="Alumnos vigentes" value={data.summary.currentStudents} /><Metric label="Árboles activos" value={data.summary.currentTrees} /><Metric label="Observaciones" value={data.summary.currentObservations} /></div><h3 className="list-heading">Cuadrillas vigentes</h3>{data.currentCrews.length ? data.currentCrews.map(({ crew, stats }) => <article className="portal-crew" key={crew.id}><strong>{crew.name}</strong><span>{crew.zone} · {crew.status}</span><small>{stats.students} alumnos · {stats.trees} árboles · {stats.observations} observaciones</small></article>) : <p>No tienes cuadrillas vigentes.</p>}</section>)
        }
        if (user.role === 'STUDENT') {
          const [profile, trees, observations] = await Promise.all([getStudentProfile(accessToken), listStudentPortalTrees(accessToken), listStudentPortalObservations(accessToken)])
          setContent(<section className="portal-panel"><p className="eyebrow">Panel de alumno</p><h2>Mi actividad</h2>{profile.currentCrew ? <><p className="form-description">{profile.currentCrew.name} · {profile.currentCrew.zone}</p><div className="metrics"><Metric label="Árboles activos" value={trees.trees.length} /><Metric label="Mis observaciones" value={observations.observations.length} /><Metric label="Cupo de cuadrilla" value={profile.currentCrew.studentLimit} /></div></> : <p className="empty-state">No tienes una cuadrilla vigente. Contacta a tu encargado para conocer tu asignación.</p>}</section>)
        }
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) onUnauthorized()
        else if (error instanceof ApiError && error.status === 403) setContent(<p className="form-error">Tu sesión no tiene permisos para este panel.</p>)
        else setContent(<p className="form-error">No fue posible cargar el panel.</p>)
      }
    }
    if (user.role !== 'SUPER_ADMIN') void load()
  }, [accessToken, onUnauthorized, user.role])

  return content
}

function Metric({ label, value }: { label: string; value: number }) { return <article><span>{label}</span><strong>{value}</strong></article> }

export default PortalDashboard
