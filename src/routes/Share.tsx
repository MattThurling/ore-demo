import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { encode, decode } from '../utils/idEncoding'
import { base64ToUint8 } from '@mattthurling/ore'
import type { OreUnlockPayload } from '../types/unlock'
import { Share as ShareIcon } from 'lucide-react'


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
      e: envelope,
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

  if (!id) return (<div className='p-8 text-warning'>No Ore Id provided. Open this page from a link with an ?id parameter.</div>)

  return (
    
    <div className='p-8'>
      <p>
        Grant access to your published track for a particular user. Don't reencrypt the file, send them an envelope containing the decryption key, sealed with their Ore Id public key.
      </p>
      <div className='divider'></div>
      <div className='md:flex'>
        <div>
          <input
            className='file-input'
            type='file'
            accept='application/json'
            onChange={e => setMetaFile(e.target.files?.[0] ?? null)}
          />
        </div>
        <div className='mt-6 md:mt-0 md:pl-8'>
          <button
            className='btn btn-secondary min-w-64'
            disabled={!metaFile}
            onClick={shareEnvelope}
          >
            <ShareIcon />Share
          </button>
        </div>
        
      </div>
      
    </div>
  )
}

export default Share