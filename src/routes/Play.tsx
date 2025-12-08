import { useEffect, useState } from 'react'
import { decode } from '../utils/idEncoding'
import {
  initVault,
  decryptBytesAesGcm,
  importAesGcmKeyFromBytes,
  base64ToUint8,
  toArrayBuffer,
  type OreVault } from '@mattthurling/ore'
import { useSearchParams } from 'react-router'

const LOCAL_SERVER_URL = 'http://localhost:4000/files'

function arrayBufferToAudioUrl(bytes: ArrayBuffer, mimeType: string) {
  const blob = new Blob([bytes], { type: mimeType })
  return URL.createObjectURL(blob)
}

function Play() {
  const [searchParams] = useSearchParams()
  const [vault, setVault] = useState<OreVault | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>()
  
  const track = searchParams.get('track')

  const json = track ? decode(track) : null
  const trackObj = JSON.parse(json)

  useEffect(() => {
    ;(async () => {
      try {
        const v = await initVault()
        setVault(v)
      } catch (err) {
        console.log(err)
      }
    })()
  })

  async function downloadAndDecrypt() {
    if (!vault) return
    const res = await fetch(
      `${LOCAL_SERVER_URL}/${trackObj.c}.enc`
    )
    const envelope = trackObj.e
    const ivBytes = base64ToUint8(trackObj.iv)
    const cipher = await res.bytes()
    const contentKeyBytes = await vault.openEnvelope(envelope)
    const contentKey = await importAesGcmKeyFromBytes(contentKeyBytes)

    const plain = await decryptBytesAesGcm(
      cipher,
      contentKey,
      ivBytes,
    )

    const url = arrayBufferToAudioUrl(toArrayBuffer(plain), trackObj.m)

    setAudioUrl(url)
 
  }

  if (!track) return (<div className='p-8 text-warning'>No track provided. Open from a link with a ?track parameter.</div>)
  return (
    <div className='p-8'>
      <p className='text'>
        Play track decrypted with the key in the envelope sent to you.
      </p>
      <p className='mt-1'>
        <strong>Encrypted file:</strong> {trackObj.c + '.enc'}
      </p>
      <div className='divider'></div>
      <button
        className='btn btn-secondary w-full md:w-1/2'
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