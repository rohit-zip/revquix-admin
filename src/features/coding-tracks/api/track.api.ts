/**
 * ─── TRACK CURATION API (admin console) ──────────────────────────────────────
 *
 * `AdminTrackController` — §10. Paths are relative to the apiClient baseURL (/api/v1).
 *
 * ⚠ Curation lives HERE and not in revquix-web, unlike problem authoring. A track is a claim about
 * other people's problems — "do these, in this order, and finishing it is sufficient" — and it has
 * no gate and no reviewer between it and the front page. That belongs with the people who already
 * decide what gets published.
 */

import { apiClient } from "@/lib/axios"
import type {
  SaveItemsRequest,
  SaveSectionsRequest,
  SaveTrackRequest,
  TrackView,
} from "./track.types"

const BASE = "/admin/tracks"

export const listTracks = (): Promise<TrackView[]> =>
  apiClient.get<TrackView[]>(BASE).then((r) => r.data)

export const getTrack = (trackId: string): Promise<TrackView> =>
  apiClient.get<TrackView>(`${BASE}/${trackId}`).then((r) => r.data)

export const createTrack = (body: SaveTrackRequest): Promise<TrackView> =>
  apiClient.post<TrackView>(BASE, body).then((r) => r.data)

export const updateTrack = (trackId: string, body: SaveTrackRequest): Promise<TrackView> =>
  apiClient.put<TrackView>(`${BASE}/${trackId}`, body).then((r) => r.data)

export const saveSections = (trackId: string, body: SaveSectionsRequest): Promise<TrackView> =>
  apiClient.put<TrackView>(`${BASE}/${trackId}/sections`, body).then((r) => r.data)

export const saveItems = (
  trackId: string,
  sectionId: string,
  body: SaveItemsRequest,
): Promise<TrackView> =>
  apiClient.put<TrackView>(`${BASE}/${trackId}/sections/${sectionId}/items`, body).then((r) => r.data)

export const publishTrack = (trackId: string): Promise<TrackView> =>
  apiClient.post<TrackView>(`${BASE}/${trackId}/publish`).then((r) => r.data)

export const unlistTrack = (trackId: string): Promise<TrackView> =>
  apiClient.post<TrackView>(`${BASE}/${trackId}/unlist`).then((r) => r.data)

export const retireTrack = (trackId: string): Promise<TrackView> =>
  apiClient.post<TrackView>(`${BASE}/${trackId}/retire`).then((r) => r.data)
