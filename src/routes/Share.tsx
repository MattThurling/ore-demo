import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { encode, decode } from '../utils/idEncoding'
import { base64ToUint8 } from '@mattthurling/ore'
import type { OreUnlockPayload } from '../types/unlock'


import {
  type OreEnvelope,
  sealContentKey,
  importEncryptionPublicKeyFromJwk,
} from '@mattthurling/ore'


function Share() {

  const [metaFile, setMetaFile] = useState<File | null>(null)
  
  // ?id is the search parameter containing the OreID info
  const [searchParams] = useSearchParams()
  const id = searchParams.get('id')
  const json = id ? decode(id) : null
  const oreId = JSON.parse(json)
  console.log(oreId)

  async function shareEnvelope() {
    // Get the cid from the metafile
    const meta = await metaFile!.text()
    const metaJson = JSON.parse(meta)
    // Create the envelope of contentKey encrypted with user's public key
    const pk = await importEncryptionPublicKeyFromJwk(oreId.publicEncryptionKey)
    const envelope: OreEnvelope = await sealContentKey(
      base64ToUint8(metaJson.contentKeyBase64),
      pk)

    const payload: OreUnlockPayload = {
      v: 'u0',
      c: metaJson.cid,
      m: 'audio/mpeg',
      iv:  metaJson.manifest.encryption.ivBase64,
      e: {
        epk: envelope.ephemeralPublicKeyJwk,
        iv: envelope.ivBase64,
        sk: envelope.sealedContentKeyBase64,
      },
    }

    const json = JSON.stringify(payload, null, 2)
    const b58 = encode(json)

    const message =
      `Hi! I have given you access to this track\n\n\n${window.location.origin}/play?track=${b58}`
    const href =
      "https://wa.me/?text=" +
      encodeURIComponent(message)
    window.open(href, '_blank')
  }

  return (
    
    <div className='p-8'>
      <h1 className='text-3xl'>ORE | Share</h1>
      <div className='divider'></div>
      <div className='flex'>
        <div>
          <input
            className='file-input'
            type='file'
            accept='application/json'
            onChange={e => setMetaFile(e.target.files?.[0] ?? null)}
          />
        </div>
        <div>
          <button
            className='btn btn-secondary'
            disabled={!metaFile}
            onClick={shareEnvelope}
          >
            Share
          </button>
        </div>
        
      </div>
      
    </div>
  )
}

export default Share