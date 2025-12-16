import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router'
import { base64ToUint8 } from '@mattthurling/ore'
import type { OreUnlockPayload } from '../types/ore'
import { Share as ShareIcon } from 'lucide-react'
import { createStorage } from '../oreStorage/oreStorageFactory'
import { type OreId } from '../types/ore'

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
  const [oreId, setOreId] = useState<OreId | null>(null)
  const [searchParams] = useSearchParams()
  const cid = searchParams.get('id')
  

  useEffect(() => {
    if (!cid) {
      setOreId(null)
      return
    }

    async function load() {
      if (!oreStorage) return console.error('❌ storage is not defined')
      if (!cid) return console.error('❌ cid is not defined')
      const oreIdResult = await oreStorage.read<OreId>(cid)
      if (!oreIdResult || oreIdResult?.kind !== 'json') return console.error('❌ oreId is not valid json')
      setOreId(oreIdResult.value)
    }
    
    load()

  }, [cid])


  async function shareEnvelope() {
    // Get the id of the track from the metafile
    const recordJson = await recordFile!.text()
    const record = JSON.parse(recordJson)
    // Get the full track information from storage
    if (!oreStorage) return console.error('❌ storage is not defined')
    const trackResult = await oreStorage.read<track>(record.cid)
    if (!trackResult || trackResult?.kind != 'json') return console.error('❌ track info is not valid json')
    const track = trackResult.value
    // Create the envelope of contentKey encrypted with user's public key
    const pk = await importEncryptionPublicKeyFromJwk(oreId!.publicEncryptionKey)
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
    envelopeFormData.append('file', envelopeBlob, track.manifest.meta.title + ' - ' + oreId?.idName)
    const eId = await oreStorage!.write(envelopeFormData)
    console.log(eId)

    const message =
      `Hi! I have given you access to this track\n${window.location.origin}/play?envelope=${eId}`
    const href =
      "https://wa.me/?text=" +
      encodeURIComponent(message)
    window.open(href, '_blank')
  }

  if (!cid) return (<div className='p-8 text-warning'>No Ore Id provided. Open this page from a link with an ?id parameter.</div>)

  return (
    
    <div className='p-8'>
      <p>
        Grant access to your published track for <strong>{oreId?.idName}</strong>. Send them an envelope containing the decryption key, sealed with their Ore Id public key.
      </p>
      <div className='divider'></div>
      <div className='md:flex md:gap-6'>
        <div className='md:flex-1'>
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
            disabled={!recordFile}
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