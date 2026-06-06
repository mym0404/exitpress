import type { UploadCandidate } from "@exitpress/domain/export-job/schema/UploadState.js"

// Keeps the first upload candidate for each local asset path.
export const dedupeUploadCandidatesByLocalPath = (candidates: UploadCandidate[]) => {
  const uniqueCandidates = new Map<string, UploadCandidate>()

  for (const candidate of candidates) {
    if (!uniqueCandidates.has(candidate.localPath)) {
      uniqueCandidates.set(candidate.localPath, candidate)
    }
  }

  return [...uniqueCandidates.values()]
}
