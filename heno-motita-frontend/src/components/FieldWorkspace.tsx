import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { createObservation, createTree, deleteObservationImage, listObservationImages, listObservations, listTrees, updateObservation, updateObservationStatus, updateTree, updateTreeStatus, uploadObservationImage } from '../api/fieldApi'
import { ApiError } from '../api/httpClient'
import { getStudentCurrentCrew, listManagerCurrentCrews } from '../api/portalApi'
import type { Observation, ObservationImage, ObservationInput, Tree, TreeInput } from '../types/resources.types'
import type { User } from '../types/auth.types'

interface FieldWorkspaceProps { accessToken: string; user: User; onUnauthorized: () => void }

const emptyTree: TreeInput = { code: '', commonName: '', scientificName: '', latitude: 0, longitude: 0, locationDescription: '' }
const emptyObservation: ObservationInput = { lowerThirdScore: 0, middleThirdScore: 0, upperThirdScore: 0, notes: '', observationDate: new Date().toISOString().slice(0, 16), latitude: undefined, longitude: undefined }

function FieldWorkspace({ accessToken, user, onUnauthorized }: FieldWorkspaceProps) {
  const [crewId, setCrewId] = useState('')
  const [availableCrews, setAvailableCrews] = useState<Array<{ id: string; name: string }>>([])
  const [trees, setTrees] = useState<Tree[]>([])
  const [tree, setTree] = useState<Tree | null>(null)
  const [treeForm, setTreeForm] = useState(emptyTree)
  const [observations, setObservations] = useState<Observation[]>([])
  const [observation, setObservation] = useState<Observation | null>(null)
  const [observationForm, setObservationForm] = useState(emptyObservation)
  const [images, setImages] = useState<ObservationImage[]>([])
  const [image, setImage] = useState<File | null>(null)
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  function handleError(requestError: unknown) {
    if (requestError instanceof ApiError && requestError.status === 401) onUnauthorized()
    else setError(requestError instanceof ApiError ? requestError.message : 'No fue posible completar la operación.')
  }

  useEffect(() => {
    async function loadPortalCrews() {
      try {
        if (user.role === 'STUDENT') {
          const data = await getStudentCurrentCrew(accessToken)
          setAvailableCrews([{ id: data.crew.id, name: data.crew.name }])
          setCrewId(data.crew.id)
        }
        if (user.role === 'CREW_MANAGER') {
          const data = await listManagerCurrentCrews(accessToken)
          setAvailableCrews(data.crews.map(({ crew }) => ({ id: crew.id, name: crew.name })))
        }
      } catch (requestError) {
        if (requestError instanceof ApiError && requestError.status === 401) onUnauthorized()
        else if (requestError instanceof ApiError && requestError.status === 404 && user.role === 'STUDENT') setError('No tienes una cuadrilla vigente para registrar actividad de campo.')
      }
    }
    void loadPortalCrews()
  }, [accessToken, onUnauthorized, user.role])

  async function loadTrees(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError(''); setMessage('')
    try { const data = await listTrees(accessToken, crewId.trim()); setTrees(data.trees); setTree(null); setObservations([]); setObservation(null); setImages([]) } catch (requestError) { handleError(requestError) } finally { setLoading(false) }
  }

  async function saveTree(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError(''); setMessage('')
    const payload = { ...treeForm, code: treeForm.code.trim().toUpperCase().replace(/\s+/g, '-') }
    if (!/^[A-Z0-9][A-Z0-9-]{2,39}$/.test(payload.code) || payload.commonName.trim().length < 2 || payload.latitude < -90 || payload.latitude > 90 || payload.longitude < -180 || payload.longitude > 180) { setError('Revisa el código del árbol, nombre común y coordenadas.'); setLoading(false); return }
    try { const data = tree ? await updateTree(accessToken, tree.id, payload) : await createTree(accessToken, crewId.trim(), payload); setMessage(data.message); setTree(data.tree); setTreeForm(data.tree); await refreshTrees() } catch (requestError) { handleError(requestError) } finally { setLoading(false) }
  }

  async function refreshTrees() { const data = await listTrees(accessToken, crewId.trim()); setTrees(data.trees) }

  async function selectTree(value: Tree) {
    setTree(value); setTreeForm(value); setLoading(true); setError('')
    try { const data = await listObservations(accessToken, value.id); setObservations(data.observations); setObservation(null); setImages([]) } catch (requestError) { handleError(requestError) } finally { setLoading(false) }
  }

  async function saveTreeStatus(status: Tree['status']) { if (!tree) return; setLoading(true); try { const data = await updateTreeStatus(accessToken, tree.id, status); setTree(data.tree); setTreeForm(data.tree); await refreshTrees(); setMessage(data.message) } catch (requestError) { handleError(requestError) } finally { setLoading(false) } }

  async function saveObservation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!tree) return; setLoading(true); setError(''); setMessage('')
    const observationDate = new Date(observationForm.observationDate).toISOString()
    const payload = { ...observationForm, observationDate }
    try { const data = observation ? await updateObservation(accessToken, observation.id, payload) : await createObservation(accessToken, tree.id, payload); setMessage(data.message); setObservation(data.observation); setObservationForm({ ...data.observation.hawksworth, notes: data.observation.notes, observationDate: data.observation.observationDate.slice(0, 16), latitude: data.observation.latitude, longitude: data.observation.longitude }); const list = await listObservations(accessToken, tree.id); setObservations(list.observations) } catch (requestError) { handleError(requestError) } finally { setLoading(false) }
  }

  async function selectObservation(value: Observation) {
    setObservation(value); setObservationForm({ ...value.hawksworth, notes: value.notes, observationDate: value.observationDate.slice(0, 16), latitude: value.latitude, longitude: value.longitude }); setLoading(true); setError('')
    try { const data = await listObservationImages(accessToken, value.id); setImages(data.images) } catch (requestError) { handleError(requestError) } finally { setLoading(false) }
  }

  async function saveObservationStatus(status: Observation['status']) { if (!observation) return; setLoading(true); try { const data = await updateObservationStatus(accessToken, observation.id, status); setObservation(data.observation); setMessage(data.message) } catch (requestError) { handleError(requestError) } finally { setLoading(false) } }

  async function uploadImage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!observation || !image) return; if (!['image/jpeg', 'image/png', 'image/webp'].includes(image.type) || image.size > 8 * 1024 * 1024 || description.length > 500) { setError('La evidencia debe ser JPG, PNG o WEBP, pesar máximo 8 MB y tener una descripción de hasta 500 caracteres.'); return }
    setLoading(true); setError('')
    try { const data = await uploadObservationImage(accessToken, observation.id, image, description); setImages((current) => [data.image, ...current]); setImage(null); setDescription(''); setMessage(data.message) } catch (requestError) { handleError(requestError) } finally { setLoading(false) }
  }

  async function removeImage(imageId: string) { if (!observation || !window.confirm('¿Eliminar esta evidencia de forma permanente?')) return; setLoading(true); try { const data = await deleteObservationImage(accessToken, observation.id, imageId); setImages((current) => current.filter((item) => item.id !== imageId)); setMessage(data.message) } catch (requestError) { handleError(requestError) } finally { setLoading(false) } }

  const canManageStatus = user.role !== 'STUDENT'

  return <section className="workspace"><div className="dashboard-heading"><div><p className="eyebrow">Registro de campo</p><h2>Árboles y observaciones</h2></div></div><p className="form-description">Selecciona una cuadrilla para consultar o registrar datos. La API aplica los permisos de tu rol.</p>{error && <p className="form-error" role="alert">{error}</p>}{message && <p className="notice" role="status">{message}</p>}<form className="inline-form" onSubmit={(event) => void loadTrees(event)}><label>Cuadrilla{availableCrews.length ? <select value={crewId} onChange={(event) => setCrewId(event.target.value)} required><option value="">Selecciona una cuadrilla</option>{availableCrews.map((crew) => <option key={crew.id} value={crew.id}>{crew.name}</option>)}</select> : <input value={crewId} onChange={(event) => setCrewId(event.target.value)} minLength={24} maxLength={24} pattern="[a-fA-F0-9]{24}" required />}</label><button disabled={loading}>Cargar cuadrilla</button></form>{trees.length > 0 || crewId ? <div className="workspace-grid"><div><form className="compact-form" onSubmit={(event) => void saveTree(event)}><h3>{tree ? 'Editar árbol' : 'Registrar árbol'}</h3><label>Código<input value={treeForm.code} onChange={(event) => setTreeForm({ ...treeForm, code: event.target.value })} minLength={3} maxLength={40} required /></label><label>Nombre común<input value={treeForm.commonName} onChange={(event) => setTreeForm({ ...treeForm, commonName: event.target.value })} minLength={2} maxLength={120} required /></label><label>Nombre científico<input value={treeForm.scientificName} onChange={(event) => setTreeForm({ ...treeForm, scientificName: event.target.value })} maxLength={160} /></label><label>Latitud<input type="number" value={treeForm.latitude} onChange={(event) => setTreeForm({ ...treeForm, latitude: Number(event.target.value) })} min={-90} max={90} step="any" required /></label><label>Longitud<input type="number" value={treeForm.longitude} onChange={(event) => setTreeForm({ ...treeForm, longitude: Number(event.target.value) })} min={-180} max={180} step="any" required /></label><label>Ubicación<input value={treeForm.locationDescription} onChange={(event) => setTreeForm({ ...treeForm, locationDescription: event.target.value })} maxLength={300} /></label><button disabled={loading}>{tree ? 'Guardar árbol' : 'Registrar árbol'}</button>{tree && <button type="button" className="secondary-button" onClick={() => { setTree(null); setTreeForm(emptyTree) }}>Nuevo árbol</button>}{tree && canManageStatus && <select value={tree.status} onChange={(event) => void saveTreeStatus(event.target.value as Tree['status'])}><option value="ACTIVE">Activo</option><option value="INACTIVE">Inactivo</option><option value="ARCHIVED">Archivado</option></select>}</form><h3 className="list-heading">Árboles</h3>{trees.map((item) => <button className="record-button" type="button" key={item.id} onClick={() => void selectTree(item)}>{item.code} · {item.commonName} <small>{item.status}</small></button>)}</div>{tree && <div><form className="compact-form" onSubmit={(event) => void saveObservation(event)}><h3>{observation ? 'Editar observación' : 'Nueva observación'}</h3>{(['lowerThirdScore', 'middleThirdScore', 'upperThirdScore'] as const).map((field) => <label key={field}>{{ lowerThirdScore: 'Tercio inferior', middleThirdScore: 'Tercio medio', upperThirdScore: 'Tercio superior' }[field]}<select value={observationForm[field]} onChange={(event) => setObservationForm({ ...observationForm, [field]: Number(event.target.value) as 0 | 1 | 2 })}><option value={0}>0</option><option value={1}>1</option><option value={2}>2</option></select></label>)}<label>Fecha<input type="datetime-local" value={observationForm.observationDate} onChange={(event) => setObservationForm({ ...observationForm, observationDate: event.target.value })} required /></label><label>Notas<textarea value={observationForm.notes} onChange={(event) => setObservationForm({ ...observationForm, notes: event.target.value })} maxLength={1000} /></label><button disabled={loading}>{observation ? 'Guardar observación' : 'Registrar observación'}</button>{observation && <button type="button" className="secondary-button" onClick={() => { setObservation(null); setObservationForm(emptyObservation); setImages([]) }}>Nueva observación</button>}{observation && canManageStatus && <select value={observation.status} onChange={(event) => void saveObservationStatus(event.target.value as Observation['status'])}><option value="ACTIVE">Activa</option><option value="ARCHIVED">Archivada</option></select>}</form><h3 className="list-heading">Observaciones</h3>{observations.map((item) => <button className="record-button" type="button" key={item.id} onClick={() => void selectObservation(item)}>Puntuación {item.hawksworth.totalScore}/6 <small>{item.status}</small></button>)}{observation && <form className="compact-form evidence-form" onSubmit={(event) => void uploadImage(event)}><h3>Evidencia fotográfica</h3><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setImage(event.target.files?.[0] ?? null)} required /><textarea placeholder="Descripción opcional" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={500} /><button disabled={loading}>Subir evidencia</button>{images.map((item) => <div className="image-row" key={item.id}><a href={item.secureUrl} target="_blank" rel="noreferrer">{item.originalFilename}</a><button type="button" className="secondary-button" onClick={() => void removeImage(item.id)}>Eliminar</button></div>)}</form>}</div>}</div> : null}</section>
}

export default FieldWorkspace
