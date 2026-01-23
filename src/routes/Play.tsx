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
import { useUIStore } from '../state/uiStore'

const oreStorage = createStorage(import.meta.env.VITE_STORAGE_TYPE)

type Track = {
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
  const [envelopeHash, setEnvelopeHash] = useState<string>(() => searchParams.get('envelope') ?? '') // This is the ipfs hash of the OreId, input either via search params or pasted by the user
  const [audioUrl, setAudioUrl] = useState<string | null>()
  const [status, setStatus] = useState<'' | 'working'>('')
  const [error, setError] = useState<string>('')
  const [track, setTrack] = useState<Track | null>(null)
  const nerdMode = useUIStore(s => s.nerdMode)
  
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
    if (!vault) { setError('❌ vault is not defined'); return }
    // Check storage
    if (!oreStorage) { setError('❌ storage is not defined'); return }
    // Read the envelope
    if (!envelopeHash) { setError('❌ envelope is not defined'); return }
    setStatus('working')
    const payloadResult = await oreStorage.read<OreUnlockPayload>(envelopeHash)
    // Read the reference to the track
    if (!payloadResult || payloadResult?.kind !== 'json') { setError('❌ envelope is not valid json'); return } 
    const payload = payloadResult.value
    const trackResult = await oreStorage.read<Track>(payload.c)
    // Read the encrypted file
    if (!trackResult || trackResult?.kind !== 'json') { setError('❌ track is not valid json'); return }
    setTrack(trackResult.value)
    const cipherResult = await oreStorage.read(trackResult.value.cid)
    if (!cipherResult || cipherResult?.kind !== 'bytes') { setError('❌ not valid bytes'); return }
    // Convert to the right format
    const cipher = new Uint8Array(cipherResult.value)
  
    const envelope = payload.e
    const ivBytes = base64ToUint8(payload.iv)
    let contentKeyBytes
    try {
      contentKeyBytes = await vault.openEnvelope(envelope)
    } catch {
      setError("❌ can't open envelope")
      return
    }
    const contentKey = await importAesGcmKeyFromBytes(contentKeyBytes)

    const plain = await decryptBytesAesGcm(
      cipher,
      contentKey,
      ivBytes,
    )

    const url = arrayBufferToAudioUrl(toArrayBuffer(plain), payload.m)
    console.log(url)
    setAudioUrl(url)
 
  }

  return (
    <div className='p-8'>
      <p className='text'>
        Open the envelope and unlock the track.
      </p>
      <div className='divider'></div>
      {track ? (
        <div>
          <h2 className='text-lg'>{track.manifest.meta.title}</h2>
          <audio
            hidden={!audioUrl}
            className='w-full md:w-1/2 mt-6'
            id='player'
            controls
            src={audioUrl ?? undefined} />
        </div>
      ) : (
        <div className='md:flex md:gap-6'>
          <div className='mt-6 md:mt-0 md:flex-1'>
            <input
              className='input w-full'
              type='text'
              value={envelopeHash}
              onChange={e => setEnvelopeHash(e.target.value)}
              placeholder='Enter ID of track to unlock' />
          </div>
          <div className='mt-6 md:mt-0 md:flex-1'>
            <button
              hidden={!!audioUrl}
              className='btn btn-secondary w-full'
              disabled={!!status}
              onClick={downloadAndDecrypt}>
                Decrypt
            </button>
          </div>
        </div>
      )}
      {error && (<p className='mt-4'>Error {error}</p>)}
      {nerdMode && (
        <div className='text-sm font-mono space-y-4 mt-6'>
          <div className='divider'></div>
          <p>Uses the private key held in this browser's local storage to open the envelope, ie to decrypt the content key. Then downloads the encrypted track from <a className='link' href='https://en.wikipedia.org/wiki/InterPlanetary_File_System'>IPFS</a> and decrypts it with the content key.</p>
        </div>
      )}

    </div>
  )
}

export default Play