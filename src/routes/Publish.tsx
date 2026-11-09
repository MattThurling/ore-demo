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
import { useUIStore } from '../state/uiStore'
import { gatewayUrl } from '../oreStorage/gateways'
import {
  ROLES,
  SLOTS,
  STEM_CATEGORIES,
  type Contributor,
  type PublishedTrack,
  type RightsRecord,
  type Role,
  type SplitParams,
} from '../types/ore'
import { DEFAULT_SPLIT, EXAMPLE_CONTRIBUTORS, EXAMPLE_REGISTRANT, EXAMPLE_TITLE } from '../data/example'

const oreStorage = createStorage(import.meta.env.VITE_STORAGE_TYPE)

type Row = Contributor & { key: string }
const withKeys = (cs: Contributor[]): Row[] => cs.map((c) => ({ ...c, key: crypto.randomUUID() }))

function Publish() {
  const [publishFile, setPublishFile] = useState<File | null>(null)
  const [trackName, setTrackName] = useState<string>('')
  const [registrant, setRegistrant] = useState<string>('')
  const [rows, setRows] = useState<Row[]>([])
  const [split, setSplit] = useState<SplitParams>(DEFAULT_SPLIT)
  const [publishId, setPublishId] = useState<string>('')
  const [status, setStatus] = useState<'' | 'uploading' | 'published'>('')
  const nerdMode = useUIStore(s => s.nerdMode)

  const handles = Array.from(new Set(rows.map((r) => r.handle).filter(Boolean)))
  const categories = Array.from(new Set(rows.map((r) => r.category)))
  const rightsValid = rows.length > 0 && rows.every((r) => r.name && r.handle && r.slot && r.category) && handles.includes(registrant)

  function fillExample() {
    setTrackName(EXAMPLE_TITLE)
    setRegistrant(EXAMPLE_REGISTRANT)
    setRows(withKeys(EXAMPLE_CONTRIBUTORS))
    setSplit(DEFAULT_SPLIT)
  }

  function update(key: string, patch: Partial<Contributor>) {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)))
  }

  function addRow() {
    const used = new Set(rows.map((r) => r.slot))
    const slot = SLOTS.find((s) => !used.has(s)) ?? 'G'
    setRows((rs) => [...rs, { key: crypto.randomUUID(), name: '', handle: '', wallet: '', slot, category: 'guitar', role: 'performer', audibleSec: 60 }])
  }

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
    if (!encId) { setStatus(''); return }
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
    // The rights record: who contributed what, and the agreed split rule
    const rights: RightsRecord = {
      version: '0.0.1',
      title: trackName,
      registrant,
      contributors: rows.map((r) => ({ name: r.name, handle: r.handle, wallet: r.wallet, slot: r.slot, category: r.category, role: r.role, audibleSec: r.audibleSec, derivedFrom: r.derivedFrom || undefined })),
      split: {
        ...split,
        // Only keep weights for categories actually used in this work
        categoryWeights: Object.fromEntries(categories.map((c) => [c, split.categoryWeights[c] ?? 1])),
      },
    }
    // Published track = where the ciphertext is + how to decrypt it + who holds rights
    const publishMeta: PublishedTrack = {
      cid: encId,
      manifest,
      rights,
    }
    // Now wrap this in a new FormDataObject
    const publishFormData = new FormData()
    const publishJson = JSON.stringify(publishMeta, null, 2)
    const publishBlob = new Blob([publishJson], { type: 'application/json'})
    publishFormData.append('file', publishBlob, trackName)
    // And publish this as the reference to to the encrypted file
    const pId = await oreStorage!.write(publishFormData)
    // Now write a local publish record, including the content key used for encryption
    if (pId) setPublishId(pId); else { setStatus(''); return }
    setStatus('published')

    const publishRecord = {
      cid: pId,
      url: gatewayUrl(pId),
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
        Choose a .wav or .mp3 file to publish. It will be encrypted and published to IPFS together with a rights record naming every contributor. The (symmetric) encryption key will be saved locally.
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
            value={trackName}
            onChange={e => setTrackName(e.target.value)}
            placeholder='Enter track name' />
        </div>
        <div className='mt-6 md:mt-0 md:flex-1'>
          <select className='select w-full' value={registrant} onChange={e => setRegistrant(e.target.value)}>
            <option value=''>Registrant (who is publishing)</option>
            {handles.map((h) => <option key={h} value={h}>@{h}</option>)}
          </select>
        </div>
      </div>

      <div className='divider'></div>
      <div className='flex items-center justify-between'>
        <h2 className='font-bold'>Contributors</h2>
        <div className='flex gap-2'>
          <button className='btn btn-sm btn-outline' onClick={fillExample} disabled={!!status}>Fill example</button>
          <button className='btn btn-sm' onClick={addRow} disabled={!!status}>+ Add stem</button>
        </div>
      </div>
      {rows.length === 0 ? (
        <p className='mt-4 text-sm opacity-70'>No contributors yet. Add a stem per contributor, or fill the example.</p>
      ) : (
        <div className='overflow-x-auto mt-4'>
          <table className='table table-sm'>
            <thead>
              <tr>
                <th>Name</th><th>Handle</th><th>Wallet</th><th>Slot</th><th>Stem</th><th>Role</th><th>Audible (s)</th><th>Built on</th><th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key}>
                  <td><input className='input input-sm w-24' value={r.name} onChange={e => update(r.key, { name: e.target.value })} /></td>
                  <td><input className='input input-sm w-24' value={r.handle} onChange={e => update(r.key, { handle: e.target.value.toLowerCase() })} /></td>
                  <td><input className='input input-sm w-40 font-mono text-xs' value={r.wallet} onChange={e => update(r.key, { wallet: e.target.value })} placeholder='0x…' /></td>
                  <td>
                    <select className='select select-sm w-16' value={r.slot} onChange={e => update(r.key, { slot: e.target.value })}>
                      {SLOTS.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </td>
                  <td>
                    <select className='select select-sm' value={r.category} onChange={e => update(r.key, { category: e.target.value })}>
                      {STEM_CATEGORIES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </td>
                  <td>
                    <select className='select select-sm' value={r.role} onChange={e => update(r.key, { role: e.target.value as Role })}>
                      {ROLES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </td>
                  <td><input className='input input-sm w-20' type='number' min={0} value={r.audibleSec} onChange={e => update(r.key, { audibleSec: Number(e.target.value) })} /></td>
                  <td>
                    <select className='select select-sm' value={r.derivedFrom ?? ''} onChange={e => update(r.key, { derivedFrom: e.target.value || undefined })}>
                      <option value=''>—</option>
                      {handles.filter((h) => h !== r.handle).map((h) => <option key={h} value={h}>@{h}'s stem</option>)}
                    </select>
                  </td>
                  <td><button className='btn btn-ghost btn-xs' onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))}>✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className='collapse collapse-arrow bg-base-200 mt-6'>
        <input type='checkbox' />
        <div className='collapse-title font-bold'>Split rule (declared by the rights holders)</div>
        <div className='collapse-content text-sm'>
          <p className='opacity-70 mb-4'>Platforms must divide revenue by this rule. Exposure (how long each stem was actually heard, blended with its audible duration) × craft weight per stem category, with lineage credit flowing to the stem a contribution was built on, and an originator share off the top.</p>
          <div className='grid md:grid-cols-3 gap-4'>
            <label className='form-control'>
              <span className='label-text'>Usage weight (α) · {split.usageWeight.toFixed(2)}</span>
              <input type='range' className='range range-sm' min={0} max={1} step={0.05} value={split.usageWeight} onChange={e => setSplit({ ...split, usageWeight: Number(e.target.value) })} />
            </label>
            <label className='form-control'>
              <span className='label-text'>Lineage credit · {(split.lineageCredit * 100).toFixed(0)}%</span>
              <input type='range' className='range range-sm' min={0} max={0.6} step={0.05} value={split.lineageCredit} onChange={e => setSplit({ ...split, lineageCredit: Number(e.target.value) })} />
            </label>
            <label className='form-control'>
              <span className='label-text'>Originator share · {(split.originatorShare * 100).toFixed(0)}%</span>
              <input type='range' className='range range-sm' min={0} max={0.3} step={0.01} value={split.originatorShare} onChange={e => setSplit({ ...split, originatorShare: Number(e.target.value) })} />
            </label>
          </div>
          {categories.length > 0 && (
            <div className='mt-4'>
              <span className='label-text'>Craft weight per stem category</span>
              <div className='flex flex-wrap gap-3 mt-2'>
                {categories.map((c) => (
                  <label key={c} className='flex items-center gap-2'>
                    <span>{c}</span>
                    <input className='input input-sm w-20' type='number' step={0.05} min={0} value={split.categoryWeights[c] ?? 1}
                      onChange={e => setSplit({ ...split, categoryWeights: { ...split.categoryWeights, [c]: Number(e.target.value) } })} />
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className='mt-6'>
        <button
          className='btn btn-secondary w-full md:w-1/3'
          disabled={!publishFile || !trackName || !rightsValid || !!status}
          onClick={encryptAndPublish}
          >
            {status === 'uploading' ? 'Encrypting and publishing…' : 'Encrypt and publish'}
        </button>
        {!rightsValid && rows.length > 0 && <p className='text-xs mt-2 opacity-70'>Every contributor needs a name and handle, and the registrant must be one of them.</p>}
      </div>

      {publishId && (
        <div className='mt-6'>
          <p className='text'>
            Your track and its rights record have been published to the InterPlanetary File System!
          </p>
          <div className='mt-6'>
            <a href={gatewayUrl(publishId)} className='hover-3d mx-2 cursor-pointer'>
              <div className='card w-full bg-black text-white'>
                <div className='card-body'>
                  <div className='card-title'>
                    {trackName}
                  </div>
                  <p>{publishId}</p>
                  <p className='text-xs opacity-70'>{rows.length} contributions · registrant @{registrant}</p>
                </div>
              </div>
            </a>
          </div>
        </div>
      )}
      {nerdMode && (
        <div className='text-sm font-mono space-y-4 mt-6'>
          <div className='divider'></div>
          <p>Uses the browser's built-in <a className='link' href='https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API'>Web Crypto API</a> to generate a unique content key for the <a className='link' href='https://en.wikipedia.org/wiki/Symmetric-key_algorithm'>symmetric encryption</a> of an audio file using <a className='link' href='https://en.wikipedia.org/wiki/Advanced_Encryption_Standard'>AES</a>.</p>
          <p>The encrypted file is then published to <a className='link' href='https://en.wikipedia.org/wiki/InterPlanetary_File_System'>IPFS</a>, while the encryption key and track metadata are downloaded locally as a json file.</p>
          <p>The published track JSON also carries an Open Rights Protocol <em>rights record</em>: every contributor, their stem and lineage, and the split rule they agreed. Because it is content-addressed, nobody can change it afterwards without the CID changing.</p>
          <p>The user need only do this once per track.</p>
        </div>
      )}
    </div>
  )
}

export default Publish
