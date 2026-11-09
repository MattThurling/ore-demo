import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { base64ToUint8 } from '@mattthurling/ore'
import type { LicenceTerms, OreId, OreUnlockPayload, PublishedTrack } from '../types/ore'
import { Share as ShareIcon, Copy, Check } from 'lucide-react'
import { createStorage } from '../oreStorage/oreStorageFactory'
import { useUIStore } from '../state/uiStore'

const oreStorage = createStorage(import.meta.env.VITE_STORAGE_TYPE)

import {
  type OreEnvelope,
  sealContentKey,
  importEncryptionPublicKeyFromJwk,
} from '@mattthurling/ore'

const DEFAULT_RATE = 0.001 // EUR per listened second

function Share() {
  const [recordFile, setRecordFile] = useState<File | null>(null)
  const [searchParams] = useSearchParams()
  // If an id is provided in the url, use that to set the value of oreHash, the ipfs id of the oreID we need to load
  const [oreHash, setOreHash] = useState<string>(() => searchParams.get('id') ?? '') // This is the ipfs hash of the OreId, input either via search params or pasted by the user
  const [isPlatform, setIsPlatform] = useState(false)
  const [rate, setRate] = useState(DEFAULT_RATE)
  const [status, setStatus] = useState<'' | 'working' | 'done'>('')
  const [error, setError] = useState('')
  const [envelopeId, setEnvelopeId] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [copied, setCopied] = useState(false)
  const nerdMode = useUIStore(s => s.nerdMode)

  async function shareEnvelope() {
    setStatus('working')
    setError('')
    // Get the id of the track from the metafile
    const recordJson = await recordFile!.text()
    const record = JSON.parse(recordJson)
    // Get the full track information from storage
    if (!oreStorage) { setError('storage is not defined'); setStatus(''); return }
    const trackResult = await oreStorage.read<PublishedTrack>(record.cid)
    if (!trackResult || trackResult?.kind != 'json') { setError('track info is not valid json'); setStatus(''); return }
    const track = trackResult.value
    if (isPlatform && !track.rights) { setError('this track has no rights record, so it cannot be licensed to a platform'); setStatus(''); return }
    // Get the recipient oreId from storage
    const oreIdResult = await oreStorage.read<OreId>(oreHash)
    if (!oreIdResult || oreIdResult?.kind !== 'json') { setError('oreId is not valid json'); setStatus(''); return }
    const oreId = oreIdResult.value
    setRecipientName(oreId.idName)
    // Create the envelope of contentKey encrypted with user's public key
    const pk = await importEncryptionPublicKeyFromJwk(oreId.publicEncryptionKey)
    const envelope: OreEnvelope = await sealContentKey(
      base64ToUint8(record.key),
      pk)

    // Licence terms travel with a platform's envelope
    const licence: LicenceTerms | undefined = isPlatform
      ? { model: 'per-listened-second', ratePerSecond: rate, currency: 'EUR', settlement: 'batch' }
      : undefined

    // Create an unlock payload. Used short field keys to keep encoded urls short but could make more explicit if that mode is abandoned
    const payload: OreUnlockPayload = {
      v: '0.0.1',
      c: record.cid,
      m: 'audio/mpeg',
      iv: track.manifest.encryption.ivBase64,
      e: envelope,
      ...(licence ? { licence } : {}),
    }

    // Write this to storage
    const envelopeFormData = new FormData()
    const envelopeJson = JSON.stringify(payload, null, 2)
    const envelopeBlob = new Blob([envelopeJson], { type: 'application/json' })
    envelopeFormData.append('file', envelopeBlob, (track.manifest.meta?.title ?? track.rights?.title ?? 'track') + ' - ' + oreId.idName)
    const eId = await oreStorage!.write(envelopeFormData)
    if (!eId) { setError('pinning the envelope failed'); setStatus(''); return }
    setEnvelopeId(eId)
    setStatus('done')

    // Listeners get a WhatsApp link straight away. Platforms paste the CID into their own tool.
    if (!isPlatform) openWhatsApp(eId)
  }

  function openWhatsApp(eId: string) {
    const message =
      `Hi! I have given you access to this track\n${window.location.origin}/play?envelope=${eId}`
    const href =
      "https://wa.me/?text=" +
      encodeURIComponent(message)
    window.open(href, '_blank')
  }

  async function copyCid() {
    await navigator.clipboard.writeText(envelopeId)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
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
            disabled={!recordFile || !oreHash || status === 'working'}
            onClick={shareEnvelope}
          >
            <ShareIcon />{status === 'working' ? 'Sealing…' : 'Share'}
          </button>
        </div>
      </div>

      <div className='mt-6 md:flex md:gap-6 md:items-center'>
        <label className='label cursor-pointer gap-3'>
          <input type='checkbox' className='toggle toggle-secondary' checked={isPlatform} onChange={e => setIsPlatform(e.target.checked)} />
          <span className='label-text'>Recipient is a platform (attach licence terms)</span>
        </label>
        {isPlatform && (
          <label className='mt-4 md:mt-0 flex items-center gap-3'>
            <span className='label-text'>Rate: EUR per listened second</span>
            <input className='input input-sm w-28' type='number' step='0.0005' min={0} value={rate} onChange={e => setRate(Number(e.target.value))} />
            <span className='label-text opacity-70'>· batch settlement</span>
          </label>
        )}
      </div>

      {error && <p className='mt-4 text-error'>❌ {error}</p>}

      {envelopeId && (
        <div className='mt-6'>
          <p>
            Envelope sealed for <strong>{recipientName}</strong>{isPlatform ? ` with licence terms (€${rate} per listened second).` : '.'}
            {isPlatform && ' Paste this CID into the platform to let it open the envelope:'}
          </p>
          <div className='mt-3 flex items-center gap-2'>
            <code className='bg-base-200 rounded px-3 py-2 text-sm break-all flex-1'>{envelopeId}</code>
            <button className='btn btn-sm btn-outline' onClick={copyCid}>{copied ? <Check /> : <Copy />}{copied ? 'Copied' : 'Copy'}</button>
            <button className='btn btn-sm btn-outline' onClick={() => openWhatsApp(envelopeId)}><ShareIcon />WhatsApp</button>
          </div>
        </div>
      )}

      {nerdMode && (
        <div className='text-sm font-mono space-y-4 mt-6'>
          <div className='divider'></div>
          <p>Encrypts the creator's locally-stored content key, used to symmetrically encrypt the audio track, with the recipient's public key. This creates a tiny 'envelope' to share with a particular user, rather than asymetrically encrypting the whole track each time.</p>
          <p>When the recipient is a platform, the envelope payload also carries the <em>licence terms</em>: what the platform pays per listened second and how it settles. The split between contributors is not negotiated here; it was declared in the track's rights record when it was published, and the platform must apply it.</p>
        </div>
      )}

    </div>
  )
}

export default Share
