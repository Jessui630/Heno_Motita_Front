import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { createManager, listCrews, listManagers, listStudentHistory } from '../api/adminApi'
import { ApiError } from '../api/httpClient'
import type { Crew, Manager, StudentHistoryItem } from '../types/admin.types'
import type { User } from '../types/auth.types'
import { validateManager } from '../utils/validators'

type Section = 'overview' | 'managers' | 'crews' | 'students'

interface DashboardProps {
  accessToken: string
  user: User
  onUnauthorized: () => void
}

const defaultManager = { name: '', email: '', password: '', phone: '', institution: '' }

function Dashboard({ accessToken, user, onUnauthorized }: DashboardProps) {
  const [section, setSection] = useState<Section>('overview')
  const [managers, setManagers] = useState<Manager[]>([])
  const [crews, setCrews] = useState<Crew[]>([])
  const [students, setStudents] = useState<StudentHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [managerForm, setManagerForm] = useState(defaultManager)
  const [creatingManager, setCreatingManager] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const [managerData, crewData, studentData] = await Promise.all([
        listManagers(accessToken),
        listCrews(accessToken),
        listStudentHistory(accessToken),
      ])
      setManagers(managerData.managers)
      setCrews(crewData.crews)
      setStudents(studentData.students)
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        onUnauthorized()
        return
      }
      setError(requestError instanceof ApiError ? requestError.message : 'No fue posible cargar la información.')
    } finally {
      setLoading(false)
    }
  }, [accessToken, onUnauthorized])

  useEffect(() => {
    if (user.role === 'SUPER_ADMIN') {
      void loadData()
    } else {
      setLoading(false)
    }
  }, [loadData, user.role])

  async function handleCreateManager(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setCreatingManager(true)
    setError('')
    setNotice('')

    const validationError = validateManager(managerForm)

    if (validationError) {
      setError(validationError)
      setCreatingManager(false)
      return
    }

    try {
      const response = await createManager(accessToken, {
        ...managerForm,
        name: managerForm.name.trim(),
        email: managerForm.email.trim().toLowerCase(),
        phone: managerForm.phone.trim(),
        institution: managerForm.institution.trim(),
      })
      setManagers((current) => [response.manager, ...current])
      setManagerForm(defaultManager)
      setNotice(response.message)
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        onUnauthorized()
        return
      }
      setError(requestError instanceof ApiError ? requestError.message : 'No fue posible crear el encargado.')
    } finally {
      setCreatingManager(false)
    }
  }

  if (user.role !== 'SUPER_ADMIN') {
    return <section className="restricted-panel"><h2>Sesión verificada</h2><p>Tu rol es {user.role}. Las operaciones disponibles se habilitarán según los permisos asignados por la API.</p></section>
  }

  return (
    <section className="dashboard">
      <nav className="dashboard-nav" aria-label="Módulos administrativos">
        {(['overview', 'managers', 'crews', 'students'] as Section[]).map((item) => (
          <button key={item} className={section === item ? 'active' : ''} type="button" onClick={() => setSection(item)}>
            {{ overview: 'Resumen', managers: 'Encargados', crews: 'Cuadrillas', students: 'Alumnos' }[item]}
          </button>
        ))}
      </nav>

      <div className="dashboard-heading">
        <div><p className="eyebrow">Administración</p><h2>{section === 'overview' ? 'Vista general' : { managers: 'Encargados', crews: 'Cuadrillas', students: 'Historial de alumnos' }[section]}</h2></div>
        <button type="button" className="refresh-button" onClick={() => void loadData()} disabled={loading}>Actualizar</button>
      </div>

      {error && <p className="form-error" role="alert">{error}</p>}
      {notice && <p className="notice" role="status">{notice}</p>}
      {loading ? <p>Cargando información protegida...</p> : <DashboardContent section={section} managers={managers} crews={crews} students={students} managerForm={managerForm} setManagerForm={setManagerForm} creatingManager={creatingManager} onCreateManager={handleCreateManager} />}
    </section>
  )
}

interface ContentProps {
  section: Section
  managers: Manager[]
  crews: Crew[]
  students: StudentHistoryItem[]
  managerForm: typeof defaultManager
  setManagerForm: (value: typeof defaultManager) => void
  creatingManager: boolean
  onCreateManager: (event: FormEvent<HTMLFormElement>) => Promise<void>
}

function DashboardContent({ section, managers, crews, students, managerForm, setManagerForm, creatingManager, onCreateManager }: ContentProps) {
  if (section === 'overview') {
    return <div className="metrics"><Metric label="Encargados" value={managers.length} /><Metric label="Cuadrillas" value={crews.length} /><Metric label="Alumnos" value={students.length} /></div>
  }

  if (section === 'managers') {
    return <div className="dashboard-grid"><form className="compact-form" onSubmit={(event) => void onCreateManager(event)}><h3>Nuevo encargado</h3><label>Nombre<input type="text" value={managerForm.name} onChange={(event) => setManagerForm({ ...managerForm, name: event.target.value })} minLength={3} maxLength={120} autoComplete="name" required /></label><label>Correo<input type="email" value={managerForm.email} onChange={(event) => setManagerForm({ ...managerForm, email: event.target.value })} maxLength={40} autoComplete="email" required /></label><label>Contraseña temporal<input type="password" value={managerForm.password} onChange={(event) => setManagerForm({ ...managerForm, password: event.target.value })} minLength={8} maxLength={12} autoComplete="new-password" aria-describedby="password-rules" required /></label><p id="password-rules" className="field-help">8 a 12 caracteres, con mayúscula, minúscula, número y carácter especial.</p><label>Teléfono (opcional)<input type="tel" value={managerForm.phone} onChange={(event) => setManagerForm({ ...managerForm, phone: event.target.value.replace(/\D/g, '').slice(0, 10) })} inputMode="numeric" pattern="[0-9]{10}" maxLength={10} autoComplete="tel" /></label><label>Institución<input type="text" value={managerForm.institution} onChange={(event) => setManagerForm({ ...managerForm, institution: event.target.value })} minLength={2} maxLength={160} autoComplete="organization" required /></label><button disabled={creatingManager}>{creatingManager ? 'Creando...' : 'Crear encargado'}</button></form><RecordTable title="Encargados" headers={['Nombre', 'Correo', 'Estado']} rows={managers.map((manager) => [manager.name, manager.email, manager.status])} /></div>
  }

  if (section === 'crews') {
    return <RecordTable title="Cuadrillas" headers={['Nombre', 'Zona', 'Encargado', 'Estado']} rows={crews.map((crew) => [crew.name, crew.zone, crew.manager?.name ?? 'Sin asignar', crew.status])} />
  }

  return <RecordTable title="Alumnos" headers={['Nombre', 'Matrícula', 'Membresías', 'Estado']} rows={students.map((item) => [item.student.name, item.student.enrollment ?? 'Sin matrícula', String(item.totalMemberships), item.student.status])} />
}

function Metric({ label, value }: { label: string; value: number }) {
  return <article><span>{label}</span><strong>{value}</strong></article>
}

function RecordTable({ title, headers, rows }: { title: string; headers: string[]; rows: string[][] }) {
  return <div className="record-table"><h3>{title}</h3><div className="table-scroll"><table><thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{rows.length ? rows.map((row, index) => <tr key={`${row[0]}-${index}`}>{row.map((value, valueIndex) => <td key={`${value}-${valueIndex}`}>{value}</td>)}</tr>) : <tr><td colSpan={headers.length}>No hay registros para mostrar.</td></tr>}</tbody></table></div></div>
}

export default Dashboard
