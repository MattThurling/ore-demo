import type oreStorage from './oreStorageInterface'
import { toArrayBuffer, type OreTrackManifest } from '@mattthurling/ore'

export default class IpfsOreStorage implements oreStorage {
  async write(manifest: OreTrackManifest, data:Uint8Array): Promise<string | void> {
    const encFormData = new FormData()
    const encBlob = new Blob([toArrayBuffer(data)], { type: 'application/octet-stream' })
    encFormData.append('file', encBlob, manifest.meta!.title)
    const encCid = await this._writeIpfs(encFormData)

    const publishMetadata = {
      cid: encCid,
      manifest,
    }

    const metaJson = JSON.stringify(publishMetadata, null, 2)

    const metaFormData = new FormData()
    const metaBlob = new Blob([metaJson], { type: 'application/json'})
    metaFormData.append('file', metaBlob, 'not sure it matters')

    const metaCid = await this._writeIpfs(metaFormData)
    return metaCid

  }

  // Write the encrypted file to IPFS
  async _writeIpfs(formData: FormData): Promise<string | void> {
    try {
      const response = await fetch(`${import.meta.env.VITE_STORAGE_URL}/pin` , {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        // Handle HTTP errors (4xx or 5xx)
        const errorText = await response.text()
        throw new Error(`Pinning failed: ${response.status} - ${errorText}`)
      }

      const json = await response.json()
      return json.cid
    } catch (error) {
      console.log('❌ Error during API call:', error)
    }
  }


  async read(key: string): Promise<string | null> {
    return('Writing file' + key)
  }

  async delete(key: string): Promise<void> {
    console.log('Deleting file' + key)
  }
}