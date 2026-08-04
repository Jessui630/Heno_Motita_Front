import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '../api/httpClient'
import { getManagerDashboard, getStudentProfile, listStudentPortalObservations, listStudentPortalTrees } from '../api/portalApi'
import type { ManagerDashboard, StudentProfile } from '../api/portalApi'
import type { User } from '../types/auth.types'

interface PortalDashboardProps { accessToken: string; user: User; onUnauthorized: () => void }

function PortalDashboard({ accessToken, user, onUnauthorized }: PortalDashboardProps) {
  const [managerDashboard, setManagerDashboard] = useState<ManagerDashboard | null>(null)
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null)
  const [studentActivity, setStudentActivity] = useState({ trees: 0, observations: 0 })
  const [loading, setLoading] = useState(user.role !== 'SUPER_ADMIN')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (user.role === 'SUPER_ADMIN') return
    setLoading(true)
    setError('')

    try {
      if (user.role === 'CREW_MANAGER') {
        setManagerDashboard(await getManagerDashboard(accessToken))
        return
      }

      const profile = await getStudentProfile(accessToken)
      setStudentProfile(profile)

      if (!profile.currentCrew) {
        setStudentActivity({ trees: 0, observations: 0 })
        return
      }

      const [trees, observations] = await Promise.all([
        listStudentPortalTrees(accessToken),
        listStudentPortalObservations(accessToken),
      ])
      setStudentActivity({ trees: trees.trees.length, observations: observations.observations.length })
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) onUnauthorized()
      else if (requestError instanceof ApiError && requestError.status === 403) setError('Tu sesión no tiene permisos para este panel.')
      else setError('No fue posible cargar el panel. Intenta actualizarlo.')
    } finally {
      setLoading(false)
    }
  }, [accessToken, onUnauthorized, user.role])

  useEffect(() => { void load() }, [load])

  if (user.role === 'SUPER_ADMIN') return null

  return <section className="portal-panel" aria-live="polite">
    <div className="dashboard-heading"><div><p className="eyebrow">{user.role === 'CREW_MANAGER' ? 'Panel de encargado' : 'Panel de alumno'}</p><h2>{user.role === 'CREW_MANAGER' ? 'Resumen de cuadrillas' : 'Mi actividad'}</h2></div><button type="button" className="refresh-button" onClick={() => void load()} disabled={loading}>Actualizar</button></div>
    {loading && <p className="panel-loading">Cargando información de tu sesión...</p>}
    {error && <p className="form-error" role="alert">{error}</p>}
    {!loading && !error && managerDashboard && <ManagerContent dashboard={managerDashboard} />}
    {!loading && !error && studentProfile && <StudentContent profile={studentProfile} trees={studentActivity.trees} observations={studentActivity.observations} />}
  </section>
}

function ManagerContent({ dashboard }: { dashboard: ManagerDashboard }) {
  return <><p className="form-description">Información de las cuadrillas asignadas a {dashboard.manager.name}.</p><div className="metrics portal-metrics"><Metric label="Asignadas" value={dashboard.summary.assignedCrews} /><Metric label="Activas" value={dashboard.summary.activeCrews} /><Metric label="Pendientes" value={dashboard.summary.pendingCrews} /><Metric label="Alumnos vigentes" value={dashboard.summary.currentStudents} /><Metric label="Árboles activos" value={dashboard.summary.currentTrees} /><Metric label="Observaciones" value={dashboard.summary.currentObservations} /><Metric label="Evidencias" value={dashboard.summary.currentImages} /></div><h3 className="list-heading">Cuadrillas vigentes</h3>{dashboard.currentCrews.length ? <div className="portal-crew-list">{dashboard.currentCrews.map(({ crew, stats }) => <article className="portal-crew" key={crew.id}><div><strong>{crew.name}</strong><span>{crew.zone} · {crew.institution}</span></div><small>{stats.students} alumnos · {stats.trees} árboles · {stats.observations} observaciones · {stats.images} evidencias</small><time dateTime={crew.endAt}>Vigencia hasta {new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' }).format(new Date(crew.endAt))}</time></article>)}</div> : <p className="empty-state">No tienes cuadrillas vigentes.</p>}</>
}

function StudentContent({ profile, trees, observations }: { profile: StudentProfile; trees: number; observations: number }) {
  if (!profile.currentCrew) return <p className="empty-state">No tienes una cuadrilla vigente. Contacta a tu encargado para conocer tu asignación.</p>
  return <><article className="current-crew"><p className="eyebrow">Cuadrilla vigente</p><strong>{profile.currentCrew.name}</strong><span>{profile.currentCrew.zone} · {profile.currentCrew.institution}</span></article><div className="metrics portal-metrics"><Metric label="Árboles activos" value={trees} /><Metric label="Mis observaciones" value={observations} /><Metric label="Cupo de cuadrilla" value={profile.currentCrew.studentLimit} /></div></>
}

function Metric({ label, value }: { label: string; value: number }) { return <article><span>{label}</span><strong>{value}</strong></article> }

export default PortalDashboard
