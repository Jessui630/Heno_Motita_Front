import { request } from './httpClient'
import type { Observation, ObservationImage, ObservationInput, Tree, TreeInput } from '../types/resources.types'

const auth = (accessToken: string) => ({ headers: { Authorization: `Bearer ${accessToken}` } })
const json = (accessToken: string, method: 'POST' | 'PUT' | 'PATCH', body: unknown) => ({ method, headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

export function listTrees(accessToken: string, crewId: string) { return request<{ trees: Tree[] }>(`/crews/${crewId}/trees?page=1&limit=100`, auth(accessToken)) }
export function getTree(accessToken: string, treeId: string) { return request<{ tree: Tree }>(`/trees/${treeId}`, auth(accessToken)) }
export function createTree(accessToken: string, crewId: string, tree: TreeInput) { return request<{ message: string; tree: Tree }>(`/crews/${crewId}/trees`, json(accessToken, 'POST', tree)) }
export function updateTree(accessToken: string, treeId: string, tree: TreeInput) { return request<{ message: string; tree: Tree }>(`/trees/${treeId}`, json(accessToken, 'PUT', tree)) }
export function updateTreeStatus(accessToken: string, treeId: string, status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED') { return request<{ message: string; tree: Tree }>(`/trees/${treeId}/status`, json(accessToken, 'PATCH', { status })) }

export function listObservations(accessToken: string, treeId: string) { return request<{ observations: Observation[] }>(`/trees/${treeId}/observations?page=1&limit=100`, auth(accessToken)) }
export function getObservation(accessToken: string, observationId: string) { return request<{ observation: Observation }>(`/observations/${observationId}`, auth(accessToken)) }
export function createObservation(accessToken: string, treeId: string, observation: ObservationInput) { return request<{ message: string; observation: Observation }>(`/trees/${treeId}/observations`, json(accessToken, 'POST', observation)) }
export function updateObservation(accessToken: string, observationId: string, observation: ObservationInput) { return request<{ message: string; observation: Observation }>(`/observations/${observationId}`, json(accessToken, 'PUT', observation)) }
export function updateObservationStatus(accessToken: string, observationId: string, status: 'ACTIVE' | 'ARCHIVED') { return request<{ message: string; observation: Observation }>(`/observations/${observationId}/status`, json(accessToken, 'PATCH', { status })) }

export function listObservationImages(accessToken: string, observationId: string) { return request<{ images: ObservationImage[] }>(`/observations/${observationId}/images?page=1&limit=100`, auth(accessToken)) }
export function uploadObservationImage(accessToken: string, observationId: string, image: File, description: string) { const body = new FormData(); body.append('image', image); if (description.trim()) body.append('description', description.trim()); return request<{ message: string; image: ObservationImage }>(`/observations/${observationId}/images`, { method: 'POST', headers: { Authorization: `Bearer ${accessToken}` }, body, timeoutMs: 75_000 }) }
export function deleteObservationImage(accessToken: string, observationId: string, imageId: string) { return request<{ message: string; imageId: string }>(`/observations/${observationId}/images/${imageId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } }) }
