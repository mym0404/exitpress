import { describe, expect, it } from "vitest"

import { parseCapturePostEvidenceArgs } from "./cases.js"

describe("parseCapturePostEvidenceArgs", () => {
  it("defaults asset profile to tmp", async () => {
    const parsed = await parseCapturePostEvidenceArgs([
      "--blogId",
      "my-blog",
      "--logNo",
      "123456789012",
    ])

    expect(parsed).toMatchObject({
      assetProfile: "tmp",
    })
  })

  it("accepts a metadata cache path", async () => {
    const parsed = await parseCapturePostEvidenceArgs([
      "--blogId",
      "my-blog",
      "--logNo",
      "123456789012",
      "--metadataCachePath",
      "tmp/metadata-cache.json",
    ])

    expect(parsed).toMatchObject({
      metadataCachePath: "tmp/metadata-cache.json",
    })
  })

  it("accepts persistent asset profiles", async () => {
    await expect(
      parseCapturePostEvidenceArgs([
        "--blogId",
        "my-blog",
        "--logNo",
        "123456789012",
        "--assetProfile",
        "readme",
      ]),
    ).resolves.toMatchObject({
      assetProfile: "readme",
    })
    await expect(
      parseCapturePostEvidenceArgs([
        "--blogId",
        "my-blog",
        "--logNo",
        "123456789012",
        "--assetProfile",
        "figure",
      ]),
    ).resolves.toMatchObject({
      assetProfile: "figure",
    })
  })

  it("rejects the removed temporary profile name", async () => {
    await expect(
      parseCapturePostEvidenceArgs([
        "--blogId",
        "my-blog",
        "--logNo",
        "123456789012",
        "--assetProfile",
        "temporary",
      ]),
    ).rejects.toThrow("--assetProfile readme|figure|tmp")
  })
})
