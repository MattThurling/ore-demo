import { useState } from 'react'
import { createStorage } from '../oreStorage/oreStorageFactory'
import {
  generateContentKey,
  importAesGcmKeyFromBytes,
  encryptBytesAesGcm,
  createTrackManifest,
  toArrayBuffer,
} from '@mattthurling/ore'
import { downloadBlob } from '../utils/os'

const oreStorage = createStorage(import.meta.env.VITE_STORAGE_TYPE)

function Publish() {
  const [publishFile, setPublishFile] = useState<File | null>(null)
  const [trackName, setTrackName] = useState<string>('')
  const [publishId, setPublishId] = useState<string>('')
  const [status, setStatus] = useState<'' | 'uploading' | 'published'>('')

  async function encryptAndPublish() {
    setStatus('uploading')
    // Turn the uploaded file into bytes
    const bytes = new Uint8Array(await publishFile!.arrayBuffer())
    // Generate a key for encryption
    const contentKey = await generateContentKey()
    const aesKey = await importAesGcmKeyFromBytes(contentKey)
    // Encrypt the track
    const { ciphertext, iv } = await encryptBytesAesGcm(bytes, aesKey)
    // Wrap it in a FormData object
    const encFormData = new FormData()
    const encBlob = new Blob([toArrayBuffer(ciphertext)], { type: 'application/octet-stream' })
    encFormData.append('file', encBlob, publishFile!.name)
    // Write to specified storage and get an 'id'
    const encId = await oreStorage!.write(encFormData)
    // Create track manifest
    const manifest = createTrackManifest({
      mimeType: publishFile!.type || 'audio/mpeg',
      sizeBytes: bytes.length,
      iv,
      meta: {
        title: trackName,
        fileName: publishFile!.name,
      }
    })
    // Add the id of the encrypted file
    const publishMeta = {
      cid:encId,
      manifest,
    }
    // Now wrap this in a new FormDataObject
    const publishFormData = new FormData()
    const publishJson = JSON.stringify(publishMeta, null, 2)
    const publishBlob = new Blob([publishJson], { type: 'application/json'})
    publishFormData.append('file', publishBlob, trackName)
    // And publish this as the reference to to the encrypted file
    const pId = await oreStorage!.write(publishFormData)
    // Now write a local publish record, including the content key used for encryption
    if (pId) setPublishId(pId); else return
    
    const publishRecord = {
      cid: pId,
      url: `https://ipfs.io/ipfs/${pId}`,
      key: btoa(String.fromCharCode(...contentKey)),
    }

    const json = JSON.stringify(publishRecord, null, 2)
    const jsonBlob = new Blob([json], { type: 'application/json'})
    // Save, giving it a nicer filename
    downloadBlob(jsonBlob, trackName + '-' + pId.slice(0,4) + '...' + pId.slice(-4) + '.json') 
  }


  return (
    <div className='p-8'>
      <p className='text'>
        Choose a .wav or .mp3 file to publish. It will be encrypted and published to IPFS. The (symmetric) encryption key will be saved locally.
      </p>
      <div className='divider'></div>
      <div className='md:flex md:gap-6'>
        <div className='md:flex-1'>
          <input
            className='file-input w-full'
            type='file'
            accept='audio/*'
            onChange={e => setPublishFile(e.target.files?.[0] ?? null)}
          />
        </div>
        <div className='mt-6 md:mt-0 md:flex-1'>
          <input
            className='input w-full'
            type='text'
            onChange={e => setTrackName(e.target.value)}
            placeholder='Enter track name' />
        </div>
        <div className='mt-6 md:mt-0 md:flex-1'>
          <button
            className='btn btn-secondary w-full'
            disabled={!publishFile || !trackName || !!status}
            onClick={encryptAndPublish}
            >
              Encrypt and publish
          </button>
        </div>
      </div>
      {publishId && (
        <div>
          <p className='text'>
            Your track has been published to the InterPlanetary File System!
          </p>
          <div className='mt-6'>
            <a href={`https://ipfs.io/ipfs/${publishId}`} className='hover-3d mx-2 cursor-pointer'>
              <div className='card w-full bg-black text-white'>
                <div className='card-body'>
                  <div className='card-title'>
                    {trackName}
                  </div>
                  <p>{publishId}</p>
                </div>
              </div>
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

export default Publish