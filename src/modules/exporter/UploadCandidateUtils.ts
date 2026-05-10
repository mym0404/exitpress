import type { UploadCandidate } from "./Types.js"

export const dedupeUploadCandidatesByLocalPath = (candidates: UploadCandidate[]) => {
  const uniqueCandidates = new Map<string, UploadCandidate>()

  for (const candidate of candidates) {
    if (!uniqueCandidates.has(candidate.localPath)) {
      uniqueCandidates.set(candidate.localPath, candidate)
    }
  }

  return [...uniqueCandidates.values()]
}
