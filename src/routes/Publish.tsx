import { useState } from 'react'
import { createStorage } from '../oreStorage/oreStorageFactory'
import {
  generateContentKey,
  importAesGcmKeyFromBytes,
  encryptBytesAesGcm,
  createTrackManifest,
} from '@mattthurling/ore'
import { downloadBlob } from '../utils/os'

const oreStorage = createStorage(import.meta.env.VITE_STORAGE_TYPE)

function Publish() {
  const [publishFile, setPublishFile] = useState<File | null>(null)

  async function encryptAndPublish() {
    // Turn the uploaded file into bytes
    const bytes = new Uint8Array(await publishFile!.arrayBuffer())
    // Generate a key for encryption
    const contentKey = await generateContentKey()
    const aesKey = await importAesGcmKeyFromBytes(contentKey)
    // Encrypt the track
    const { ciphertext, iv } = await encryptBytesAesGcm(bytes, aesKey)
    // Create track manifest
    const manifest = createTrackManifest({
      mimeType: publishFile!.type || 'audio/mpeg',
      sizeBytes: bytes.length,
      iv,
      meta: {
        title: publishFile!.name
      }
    })
    console.log(manifest)
    // Write to specified storage
    const publishId = await oreStorage!.write(manifest, ciphertext)
    
    const publishRecord = {
      cid: publishId,
      url: `https://ipfs.io/ipfs/${publishId}`,
      key: btoa(String.fromCharCode(...contentKey)),
    }

    const json = JSON.stringify(publishRecord, null, 2)
    const jsonBlob = new Blob([json], { type: 'application/json'})

    downloadBlob(jsonBlob, publishId + '.json') 
  }


  return (
    <div className='p-8'>
      <p className='text'>
        Choose a .wav or .mp3 file to publish. It will be encrypted once, and the (symmetric) encryption key will be saved (locally, for now) along with the encrypted file.
      </p>
      <div className='divider'></div>
      <div className='md:flex'>
        <div>
          <input
            className='file-input'
            type='file'
            accept='audio/*'
            onChange={e => setPublishFile(e.target.files?.[0] ?? null)}
          />
        </div>
        <div className='mt-6 md:mt-0 md:pl-8'>
          <button
            className='btn btn-secondary min-w-64'
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