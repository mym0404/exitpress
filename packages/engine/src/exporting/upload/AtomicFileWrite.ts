import { randomUUID } from "node:crypto"

import type * as fs from "node:fs/promises"

export type FileOps = Pick<typeof fs, "readFile" | "writeFile" | "rename" | "rm">

export const writeFileAtomically = async ({
  finalPath,
  content,
  fileOps,
}: {
  finalPath: string
  content: string
  fileOps: FileOps
}) => {
  const tempPath = `${finalPath}.${randomUUID()}.tmp`
  const backupPath = `${finalPath}.${randomUUID()}.bak`

  await fileOps.writeFile(tempPath, content, "utf8")

  try {
    await fileOps.rename(finalPath, backupPath)

    try {
      await fileOps.rename(tempPath, finalPath)
    } catch (error) {
      await fileOps.rename(backupPath, finalPath)
      throw error
    }

    await fileOps.rm(backupPath, { force: true })
  } catch (error) {
    await fileOps.rm(tempPath, { force: true })
    throw error
  }
}
