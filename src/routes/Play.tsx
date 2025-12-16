import { useEffect, useState } from 'react'
import {
  initVault,
  decryptBytesAesGcm,
  importAesGcmKeyFromBytes,
  base64ToUint8,
  toArrayBuffer,
  type OreVault } from '@mattthurling/ore'
import { useSearchParams } from 'react-router'
import { createStorage } from '../oreStorage/oreStorageFactory'
import { type OreUnlockPayload } from '../types/ore'

const oreStorage = createStorage(import.meta.env.VITE_STORAGE_TYPE)

type track = {
  cid: string,
  manifest: {
    meta: {
      title: string
    }
  }
}

function arrayBufferToAudioUrl(bytes: ArrayBuffer, mimeType: string) {
  const blob = new Blob([bytes], { type: mimeType })
  return URL.createObjectURL(blob)
}

function Play() {
  const [searchParams] = useSearchParams()
  const [vault, setVault] = useState<OreVault | null>(null)
  const [track, setTrack] = useState<track | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>()
  const [status, setStatus] = useState<'' | 'working'>('') 
  
  const eId = searchParams.get('envelope')

  useEffect(() => {
    ;(async () => {
      try {
        const v = await initVault()
        setVault(v)
      } catch (err) {
        console.log(err)
      }
    })()
  }, [])

  async function downloadAndDecrypt() {
    // Check vault
    if (!vault) return console.error('❌ vault is not defined')
    // Check storage
    if (!oreStorage) return console.error('❌ storage is not defined')
    // Read the envelope
    if (!eId) return console.error('❌ eId is not defined')
    setStatus('working')
    const payloadResult = await oreStorage.read<OreUnlockPayload>(eId)
    // Read the reference to the track
    if (!payloadResult || payloadResult?.kind !== 'json') return console.error('❌ envelope is not valid json')
    const payload = payloadResult.value
    const trackResult = await oreStorage.read<track>(payload.c)
    // Read the encrypted file
    if (!trackResult || trackResult?.kind !== 'json') return console.error('❌ track is not valid json')
    const track = trackResult.value
    setTrack(track)
    const cipherResult = await oreStorage.read(track.cid)
    if (!cipherResult || cipherResult?.kind !== 'bytes') return console.error('❌ not valid bytes')
    // Convert to the right format
    const cipher = new Uint8Array(cipherResult.value)
  
    const envelope = payload.e
    const ivBytes = base64ToUint8(payload.iv)
    const contentKeyBytes = await vault.openEnvelope(envelope)
    const contentKey = await importAesGcmKeyFromBytes(contentKeyBytes)

    const plain = await decryptBytesAesGcm(
      cipher,
      contentKey,
      ivBytes,
    )

    const url = arrayBufferToAudioUrl(toArrayBuffer(plain), payload.m)

    setAudioUrl(url)
 
  }

  if (!eId) return (<div className='p-8 text-warning'>No track provided. Open from a link with a ?track parameter.</div>)
  return (
    <div className='p-8'>
      <p className='text'>
        Play track decrypted with the key in the envelope sent to you.
      </p>
      <p className='mt-1'>
        <strong>Track:</strong> {track?.manifest.meta.title}
      </p>
      <div className='divider'></div>
      <button
        className='btn btn-secondary w-full md:w-1/2'
        disabled={!!status}
        onClick={downloadAndDecrypt}>
          Decrypt
      </button>
      <audio
        className='w-full md:w-1/2 mt-6'
        id='player'
        controls
        src={audioUrl ?? undefined} />
    </div>
  )
}

export default Play