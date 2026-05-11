import { parseSupportUnitClaim } from "./ingest-pr-claims.js"

type IngestSupportUnit = {
  supportUnitKey: string
  failureBlockHash?: string
  logNos: string[]
}

export type SupportUnitClaimPullRequest = {
  number?: number
  title?: string
  body?: string | null
  headRefName?: string
  isDraft?: boolean
  url?: string
}

const toRecord = (value: unknown) =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined

const readSupportUnitArray = (summary: Record<string, unknown>) => {
  if (Array.isArray(summary.discoveredSupportUnits)) {
    return summary.discoveredSupportUnits
  }

  if (Array.isArray(summary.allFailureGroups)) {
    return summary.allFailureGroups
  }

  if (Array.isArray(summary.failureGroups)) {
    return summary.failureGroups
  }

  return []
}

export const extractDiscoveredSupportUnits = (summary: unknown) => {
  const summaryRecord = toRecord(summary)

  if (!summaryRecord) {
    return []
  }

  const units = new Map<string, IngestSupportUnit>()

  for (const item of readSupportUnitArray(summaryRecord)) {
    const record = toRecord(item)

    if (!record) {
      continue
    }

    const supportUnitKey = record?.supportUnitKey

    if (typeof supportUnitKey !== "string") {
      continue
    }

    const current = units.get(supportUnitKey)
    const logNos = Array.isArray(record.logNos)
      ? record.logNos.filter((logNo): logNo is string => typeof logNo === "string")
      : []
    const failureBlockHash =
      typeof record.failureBlockHash === "string" ? record.failureBlockHash : undefined

    units.set(supportUnitKey, {
      supportUnitKey,
      failureBlockHash: current?.failureBlockHash ?? failureBlockHash,
      logNos: [...new Set([...(current?.logNos ?? []), ...logNos])],
    })
  }

  return [...units.values()]
}

export const createSupportUnitPrCheck = ({
  pullRequests,
  supportUnits,
}: {
  pullRequests: SupportUnitClaimPullRequest[]
  supportUnits: IngestSupportUnit[]
}) => {
  const supportUnitKeySet = new Set(supportUnits.map((unit) => unit.supportUnitKey))
  const claimsBySupportUnitKey = new Map<string, SupportUnitClaimPullRequest[]>()
  const readyClaimsBySupportUnitKey = new Map<string, SupportUnitClaimPullRequest[]>()

  for (const pullRequest of pullRequests) {
    const supportUnitKey = parseSupportUnitClaim(pullRequest.body)

    if (!supportUnitKey || !supportUnitKeySet.has(supportUnitKey)) {
      continue
    }

    claimsBySupportUnitKey.set(supportUnitKey, [
      ...(claimsBySupportUnitKey.get(supportUnitKey) ?? []),
      pullRequest,
    ])

    if (pullRequest.isDraft !== true) {
      readyClaimsBySupportUnitKey.set(supportUnitKey, [
        ...(readyClaimsBySupportUnitKey.get(supportUnitKey) ?? []),
        pullRequest,
      ])
    }
  }

  const missingSupportUnits = supportUnits.filter(
    (unit) => (readyClaimsBySupportUnitKey.get(unit.supportUnitKey) ?? []).length === 0,
  )
  const draftOnlyClaims = supportUnits.flatMap((unit) => {
    const readyPullRequestsForUnit = readyClaimsBySupportUnitKey.get(unit.supportUnitKey) ?? []

    if (readyPullRequestsForUnit.length > 0) {
      return []
    }

    return (claimsBySupportUnitKey.get(unit.supportUnitKey) ?? [])
      .filter((pullRequest) => pullRequest.isDraft === true)
      .map((pullRequest) => ({
        supportUnitKey: unit.supportUnitKey,
        pullRequest,
      }))
  })

  return {
    totalSupportUnitCount: supportUnits.length,
    claimedSupportUnitCount: supportUnits.length - missingSupportUnits.length,
    missingSupportUnits,
    draftOnlyClaims,
    complete: missingSupportUnits.length === 0 && draftOnlyClaims.length === 0,
  }
}
