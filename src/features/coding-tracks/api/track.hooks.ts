/**
 * ─── TRACK CURATION HOOKS (admin console) ────────────────────────────────────
 *
 * React Query over `AdminTrackController` — §10.
 *
 * ⚠ EVERY MUTATION RETURNS THE WHOLE TRACK, and it is written straight into the detail cache
 * rather than invalidated. Curation is a sequence of small edits — rename a section, move an item,
 * publish — and an invalidate-and-refetch between each leaves the screen a frame behind the thing
 * the curator just did. The same reason the problem review hooks seed their cache.
 */

"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { showErrorToast, showSuccessToast } from "@/lib/show-toast"

import {
  createTrack,
  getTrack,
  listTracks,
  publishTrack,
  retireTrack,
  saveItems,
  saveSections,
  unlistTrack,
  updateTrack,
} from "./track.api"
import type {
  SaveItemsRequest,
  SaveSectionsRequest,
  SaveTrackRequest,
  TrackView,
} from "./track.types"

export const trackKeys = {
  all: ["coding-track"] as const,
  list: ["coding-track", "list"] as const,
  detail: (trackId: string) => ["coding-track", trackId] as const,
}

export function useTrackList() {
  return useQuery({
    queryKey: trackKeys.list,
    queryFn: listTracks,
    staleTime: 30_000,
  })
}

export function useTrackDetail(trackId: string) {
  return useQuery({
    queryKey: trackKeys.detail(trackId),
    queryFn: () => getTrack(trackId),
    enabled: !!trackId,
  })
}

/** Shared by every write below: seed the detail, drop the list, say what happened. */
function useTrackMutation<TArgs>(
  fn: (args: TArgs) => Promise<TrackView>,
  message: string,
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: (track) => {
      queryClient.setQueryData(trackKeys.detail(track.trackId), track)
      queryClient.invalidateQueries({ queryKey: trackKeys.list })
      showSuccessToast(message)
    },
    onError: (error) => showErrorToast(error),
  })
}

export const useCreateTrack = () =>
  useTrackMutation((body: SaveTrackRequest) => createTrack(body), "Track created.")

export const useUpdateTrack = (trackId: string) =>
  useTrackMutation((body: SaveTrackRequest) => updateTrack(trackId, body), "Saved.")

export const useSaveSections = (trackId: string) =>
  useTrackMutation((body: SaveSectionsRequest) => saveSections(trackId, body), "Sections saved.")

export const useSaveItems = (trackId: string) =>
  useTrackMutation(
    (args: { sectionId: string; body: SaveItemsRequest }) =>
      saveItems(trackId, args.sectionId, args.body),
    "Problems saved.",
  )

export const usePublishTrack = (trackId: string) =>
  useTrackMutation(() => publishTrack(trackId), "Published. It is on /tracks and in the sitemap.")

export const useUnlistTrack = (trackId: string) =>
  useTrackMutation(() => unlistTrack(trackId), "Unlisted. The link still works.")

export const useRetireTrack = (trackId: string) =>
  useTrackMutation(() => retireTrack(trackId), "Retired. The URL now answers 410.")
