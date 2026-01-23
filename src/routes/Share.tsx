import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { base64ToUint8 } from '@mattthurling/ore'
import type { OreUnlockPayload } from '../types/ore'
import { Share as ShareIcon } from 'lucide-react'
import { createStorage } from '../oreStorage/oreStorageFactory'
import { type OreId } from '../types/ore'
import { useUIStore } from '../state/uiStore'

type track = {
  manifest: {
    encryption: {
      ivBase64: string
    },
    meta: {
      title: string
    }
  }
}

const oreStorage = createStorage(import.meta.env.VITE_STORAGE_TYPE)

import {
  type OreEnvelope,
  sealContentKey,
  importEncryptionPublicKeyFromJwk,
} from '@mattthurling/ore'



function Share() {
  const [recordFile, setRecordFile] = useState<File | null>(null)
  // const [oreId, setOreId] = useState<OreId | null>(null) // Read from IPFS, this is the object containing the name of the user, and the public encryption key
  const [searchParams] = useSearchParams()
  // If an id is provided in the url, use that to set the value of oreHash, the ipfs id of the oreID we need to load
  const [oreHash, setOreHash] = useState<string>(() => searchParams.get('id') ?? '') // This is the ipfs hash of the OreId, input either via search params or pasted by the user
  
  const [status, setStatus] = useState<'' | 'working'>('')
  const nerdMode = useUIStore(s => s.nerdMode)

  async function shareEnvelope() {
    setStatus('working')
    // Get the id of the track from the metafile
    const recordJson = await recordFile!.text()
    const record = JSON.parse(recordJson)
    // Get the full track information from storage
    if (!oreStorage) return console.error('❌ storage is not defined')
    const trackResult = await oreStorage.read<track>(record.cid)
    if (!trackResult || trackResult?.kind != 'json') return console.error('❌ track info is not valid json')
    const track = trackResult.value
    // Get the recipient oreId from strorage
    const oreIdResult = await oreStorage.read<OreId>(oreHash)
    if (!oreIdResult || oreIdResult?.kind !== 'json') return console.error('❌ oreId is not valid json')
    const oreId = oreIdResult.value
    // Create the envelope of contentKey encrypted with user's public key
    const pk = await importEncryptionPublicKeyFromJwk(oreId.publicEncryptionKey)
    const envelope: OreEnvelope = await sealContentKey(
      base64ToUint8(record.key),
      pk)
    
    // Create an unlock payload. Used short field keys to keep encoded urls short but could make more explicit if that mode is abandoned
    // And could probably simplify this to just the envelope as the user could read all from storage
    const payload: OreUnlockPayload = {
      v: '0.0.1',
      c: record.cid,
      m: 'audio/mpeg',
      iv: track.manifest.encryption.ivBase64,
      e: envelope,
    }

    // Write this to storage
    const envelopeFormData = new FormData()
    const envelopeJson = JSON.stringify(payload, null, 2)
    const envelopeBlob = new Blob([envelopeJson], { type: 'application/json' })
    envelopeFormData.append('file', envelopeBlob, track.manifest.meta.title + ' - ' + oreId.idName)
    const eId = await oreStorage!.write(envelopeFormData)
    console.log(eId)

    const message =
      `Hi! I have given you access to this track\n${window.location.origin}/play?envelope=${eId}`
    const href =
      "https://wa.me/?text=" +
      encodeURIComponent(message)
    window.open(href, '_blank')
  }

  return (
    
    <div className='p-8'>
      <p>
        Grant access to your published track. Send an envelope containing the decryption key, sealed with the recipient's Ore Id public key.
      </p>
      <div className='divider'></div>
      <div className='md:flex md:gap-6'>
        <div className='mt-6 md:mt-0 md:flex-1'>
           <input
            className='input w-full'
            type='text'
            placeholder='ID you want to share with'
            value={oreHash}
            onChange={e => setOreHash(e.target.value)}
          />
        </div>
        <div className='mt-6 md:mt-0 md:flex-1'>
          <input
            className='file-input w-full'
            type='file'
            accept='application/json'
            onChange={e => setRecordFile(e.target.files?.[0] ?? null)}
          />
        </div>
        <div className='mt-6 md:mt-0 md:flex-1'>
          <button
            className='btn btn-secondary w-full'
            disabled={!recordFile || !!status }
            onClick={shareEnvelope}
          >
            <ShareIcon />Share
          </button>
        </div>
        
      </div>
      {nerdMode && (
        <div className='text-sm font-mono space-y-4 mt-6'>
          <div className='divider'></div>
          <p>Encrypts the creator's locally-stored content key, used to symmetrically encrypt the audio track, with the recipient's public key. This creates a tiny 'envelope' to share with a particular user, rather than asymetrically encrypting the whole track each time.</p>
        </div>
      )}
      
    </div>
  )
}

export default Share