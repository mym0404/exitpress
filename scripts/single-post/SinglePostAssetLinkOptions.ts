import { defaultExportOptions } from "../../src/domain/export-options/ExportOptions.js"
import {
  assertAllowedKeys,
  assertBoolean,
  assertEnum,
  assertPlainObject,
  assertString,
} from "./SinglePostOptionGuards.js"
import {
  allowedAssetsKeys,
  allowedLinksKeys,
  imageHandlingModes,
  sameBlogPostModes,
  stickerAssetModes,
  thumbnailSources,
} from "./SinglePostOptionMetadata.js"

export const validateAssetsOptions = (value: unknown, optionsPath: string) => {
  assertPlainObject(value, "assets", optionsPath)
  assertAllowedKeys(value, allowedAssetsKeys, "assets", optionsPath)

  const assets = defaultExportOptions().assets

  if ("imageHandlingMode" in value) {
    const imageHandlingMode = value.imageHandlingMode
    assertEnum(imageHandlingMode, imageHandlingModes, "assets.imageHandlingMode", optionsPath)
    assets.imageHandlingMode = imageHandlingMode
  }

  if ("compressionEnabled" in value) {
    const compressionEnabled = value.compressionEnabled
    assertBoolean(compressionEnabled, "assets.compressionEnabled", optionsPath)
    assets.compressionEnabled = compressionEnabled
  }

  if ("stickerAssetMode" in value) {
    const stickerAssetMode = value.stickerAssetMode
    assertEnum(stickerAssetMode, stickerAssetModes, "assets.stickerAssetMode", optionsPath)
    assets.stickerAssetMode = stickerAssetMode
  }

  if ("downloadImages" in value) {
    const downloadImages = value.downloadImages
    assertBoolean(downloadImages, "assets.downloadImages", optionsPath)
    assets.downloadImages = downloadImages
  }

  if ("downloadThumbnails" in value) {
    const downloadThumbnails = value.downloadThumbnails
    assertBoolean(downloadThumbnails, "assets.downloadThumbnails", optionsPath)
    assets.downloadThumbnails = downloadThumbnails
  }

  if ("includeImageCaptions" in value) {
    const includeImageCaptions = value.includeImageCaptions
    assertBoolean(includeImageCaptions, "assets.includeImageCaptions", optionsPath)
    assets.includeImageCaptions = includeImageCaptions
  }

  if ("thumbnailSource" in value) {
    const thumbnailSource = value.thumbnailSource
    assertEnum(thumbnailSource, thumbnailSources, "assets.thumbnailSource", optionsPath)
    assets.thumbnailSource = thumbnailSource
  }

  return assets
}

export const validateLinksOptions = (value: unknown, optionsPath: string) => {
  assertPlainObject(value, "links", optionsPath)
  assertAllowedKeys(value, allowedLinksKeys, "links", optionsPath)

  const links = defaultExportOptions().links

  if ("sameBlogPostMode" in value) {
    const sameBlogPostMode = value.sameBlogPostMode
    assertEnum(sameBlogPostMode, sameBlogPostModes, "links.sameBlogPostMode", optionsPath)
    links.sameBlogPostMode = sameBlogPostMode
  }

  if ("sameBlogPostCustomUrlTemplate" in value) {
    const sameBlogPostCustomUrlTemplate = value.sameBlogPostCustomUrlTemplate
    assertString(sameBlogPostCustomUrlTemplate, "links.sameBlogPostCustomUrlTemplate", optionsPath)
    links.sameBlogPostCustomUrlTemplate = sameBlogPostCustomUrlTemplate
  }

  return links
}
