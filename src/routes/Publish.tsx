import { useState } from 'react'
import { createHeliaContext, addEncryptedBytes } from '../utils/useHelia'
import {
  generateContentKey,
  importAesGcmKeyFromBytes,
  encryptBytesAesGcm,
  createTrackManifest,
} from '@mattthurling/ore'
import { downloadBlob } from '../utils/os'


function Publish() {
  const [publishFile, setPublishFile] = useState<File | null>(null)

  async function encryptAndPublish() {
    const { fs } = await createHeliaContext()
    const bytes = new Uint8Array(await publishFile!.arrayBuffer())
    // ToDo: generate for now; need to store
    const contentKey = await generateContentKey()
    const aesKey = await importAesGcmKeyFromBytes(contentKey)
    const { ciphertext, iv } = await encryptBytesAesGcm(bytes, aesKey)

    const manifest = createTrackManifest({
      mimeType: publishFile!.type || 'audio/mpeg',
      sizeBytes: bytes.length,
      iv,
      meta: {
        title: publishFile!.name
      }
    })

    const cid = await addEncryptedBytes(fs, ciphertext)

    const publishMetadata = {
      version: 'ore-publish-0.1' as const,
      trackId: crypto.randomUUID(),
      cid,
      manifest,
      contentKeyBase64: btoa(String.fromCharCode(...contentKey)),
    }
    const json = JSON.stringify(publishMetadata, null, 2)
    const blob = new Blob([json], { type: 'application/json'})
    downloadBlob(blob, publishFile!.name + '.json') 
    return publishMetadata
  }


  return (
    <div className='p-8'>
      <h1 className='text-3xl'>ORE | Publish</h1>
      <div className='divider'></div>
      <div className='flex'>
        <div className='flex-1'>
          <input
            className='file-input'
            type='file'
            onChange={e => setPublishFile(e.target.files?.[0] ?? null)}
          />
        </div>
        <div className='flex-2'>
          <button
            className='btn btn-secondary'
            disabled={!publishFile}
            onClick={encryptAndPublish}
            >
              Encrypt and publish
          </button>
        </div>
      </div>
    </div>
  )
}

export default Publish