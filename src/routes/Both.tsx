import { useEffect, useState } from 'react'
import {
  initVault,
  type OreVault,
  type OreTrackManifest,
  type OreEnvelope,
  generateContentKey,
  importAesGcmKeyFromBytes,
  encryptBytesAesGcm,
  decryptBytesAesGcm,
  createTrackManifest,
  getIvFromManifest,
  importEncryptionPublicKeyFromJwk,
  sealContentKey,
  toArrayBuffer,
} from '@mattthurling/ore'

function Both() {
  const [vault, setVault] = useState<OreVault | null>(null)
  const [userPubJwk, setUserPubJwk] = useState<string>('')

  const [creatorFile, setCreatorFile] = useState<File | null>(null)
  const [creatorManifestJson, setCreatorManifestJson] = useState<string>('')
  const [creatorEnvelopeJson, setCreatorEnvelopeJson] = useState<string>('')
  const [creatorEncryptedBlobUrl, setCreatorEncryptedBlobUrl] = useState<string>('')

  const [playerEncryptedFile, setPlayerEncryptedFile] = useState<File | null>(null)
  const [playerManifestJson, setPlayerManifestJson] = useState<string>('')
  const [playerEnvelopeJson, setPlayerEnvelopeJson] = useState<string>('')
  const [playerAudioUrl, setPlayerAudioUrl] = useState<string>('')

  const [nerdMode, setNerdMode] = useState(false) 
  const [status, setStatus] = useState<string>('')

  // init vault once on mount
  useEffect(() => {
    ;(async () => {
      try {
        const v = await initVault()
        setVault(v)
        const pubJwk = await v.getPublicEncryptionKeyJwk()
        setUserPubJwk(JSON.stringify(pubJwk, null, 2))
      } catch (err) {
        console.error(err)
        setStatus('Failed to init vault – must run in a browser with WebCrypto + localStorage')
      }
    })()
  }, [])

  async function fileToUint8(file: File): Promise<Uint8Array> {
    const arrayBuffer = await file.arrayBuffer()
    return new Uint8Array(arrayBuffer)
  }

  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleCreatorEncrypt() {
    if (!creatorFile) {
      setStatus('No file selected on creator side')
      return
    }

    try {
      setStatus('Encrypting track…')

      const trackBytes = await fileToUint8(creatorFile)
      const contentKey = await generateContentKey()

      const aesKey = await importAesGcmKeyFromBytes(contentKey)

      const { ciphertext, iv } = await encryptBytesAesGcm(trackBytes, aesKey)

      const manifest: OreTrackManifest = createTrackManifest({
        mimeType: creatorFile.type || 'audio/mpeg',
        sizeBytes: trackBytes.length,
        iv,
        meta: {
          title: creatorFile.name,
        },
      })

      // use the user public key JSON that we show in the UI
      const userPubJwkParsed = JSON.parse(userPubJwk) as JsonWebKey
      const userPubKey = await importEncryptionPublicKeyFromJwk(userPubJwkParsed)

      const envelope: OreEnvelope = await sealContentKey(contentKey, userPubKey)

      // store JSON in textareas
      const manifestJson = JSON.stringify(manifest, null, 2)
      const envelopeJson = JSON.stringify(envelope, null, 2)

      setCreatorManifestJson(manifestJson)
      setCreatorEnvelopeJson(envelopeJson)

      setPlayerManifestJson(manifestJson)
      setPlayerEnvelopeJson(envelopeJson)

      // make an encrypted blob for download + player
      const encryptedBlob = new Blob([toArrayBuffer(ciphertext)], { type: 'application/octet-stream' })
      const url = URL.createObjectURL(encryptedBlob)
      setCreatorEncryptedBlobUrl(url)

      // also trigger a download so you can save the encrypted file
      downloadBlob(encryptedBlob, creatorFile.name + '.enc')

      setStatus('Track encrypted and envelope created')
    } catch (err) {
      console.error(err)
      setStatus('Error during encryption – see console')
    }
  }

  async function handlePlayerUnlockAndPlay() {
    if (!playerEncryptedFile) {
      setStatus('No encrypted file selected on player side')
      return
    }
    if (!playerManifestJson || !playerEnvelopeJson) {
      setStatus('Paste manifest and envelope JSON on player side')
      return
    }
    if (!vault) {
      setStatus('Vault not initialised')
      return
    }

    try {
      setStatus('Decrypting and playing…')

      const manifest = JSON.parse(playerManifestJson) as OreTrackManifest
      const envelope = JSON.parse(playerEnvelopeJson) as OreEnvelope

      const ciphertextBytes = await fileToUint8(playerEncryptedFile)
      const contentKeyBytes = await vault.openEnvelope(envelope)

      const aesKey = await importAesGcmKeyFromBytes(contentKeyBytes)

      const iv = getIvFromManifest(manifest)

      const decryptedBytes = await decryptBytesAesGcm(ciphertextBytes, aesKey, iv)

      const audioBlob = new Blob([toArrayBuffer(decryptedBytes)], { type: manifest.media.mimeType })
      const audioUrl = URL.createObjectURL(audioBlob)
      setPlayerAudioUrl(audioUrl)

      setStatus('Decrypted – playing audio')
    } catch (err) {
      console.error(err)
      setStatus('Error during decryption – see console')
    }
  }

  return (
    
    <div className='p-8'>
      <div className='flex items-center'>
        <div className='flex-4'>
          <h1 className='text-3xl'>Open Rights Engine</h1>
        </div>
        <div className='flex-1'>
          <input
            type='checkbox'
            checked={nerdMode}
            onChange={(e) => setNerdMode(e.target.checked)}
            className='toggle toggle-md' />
        </div>
      </div>
      
      <div className='divider'></div>

      <p>
        This demo shows the full ORE flow:
        encrypt → manifest → envelope → decrypt, using a local vault.
      </p>

      <div>
        <strong>Status:</strong> {status || 'Idle'}
      </div>
      <div className='divider'></div>
      <div>
        <h2 className='font-bold uppercase mb-3'>User Vault</h2>
        <p>
          The vault generates an ECDH keypair and stores it in localStorage.
          This public key is what a platform / creator would use to seal content keys for you.
        </p>
        <fieldset className='fieldset'>
          <legend className='fieldset-legend'>Your public encryption key (JWK)</legend>
          <textarea
            className='textarea w-128'
            value={userPubJwk}
            onChange={e => setUserPubJwk(e.target.value)}
            rows={8}
            />
            <div className='label'>Copy this JSON into the creator&apos;s tool (below) as the recipient key.</div>
        </fieldset>

      </div>
      <div className='divider'></div>

      <div>
        <div>
          <h2 className='font-bold uppercase mb-3'>Creator · Encrypt & Seal</h2>
          <div className='my-5'>
            <input
              className='file-input'
              type='file'
              accept='audio/*'
              onChange={e => setCreatorFile(e.target.files?.[0] ?? null)}
            />
          </div>

          <div className='my-5'>
            <fieldset className='fieldset'>
              <legend className='fieldset-legend'>Recipient public key (JWK)</legend>
              <textarea
                className='textarea w-128'
                value={userPubJwk}
                onChange={e => setUserPubJwk(e.target.value)}
                rows={8}
              />
            </fieldset>
          </div>

          <button
            className='btn btn-primary'
            onClick={handleCreatorEncrypt}>Encrypt & create envelope
          </button>

          <div className='divider'></div>

          <div>
            <fieldset className='fieldset'>
              <legend className='fieldset-legend'>Manifest JSON</legend>
              <textarea
                className='textarea w-128'
                value={creatorManifestJson}
                onChange={e => setCreatorManifestJson(e.target.value)}
                rows={15}
              />
            </fieldset>
            
          </div>

          <div>
            <fieldset className='fieldset'>
              <legend className='fieldset-legend'>Envelope JSON</legend>
              <textarea
                className='textarea w-128'
                value={creatorEnvelopeJson}
                onChange={e => setCreatorEnvelopeJson(e.target.value)}
                rows={17}
              />
            </fieldset>
            
          </div>

          {creatorEncryptedBlobUrl && (
            <p className='mt-3'>
              Encrypted file generated and downloaded. You can also use it directly in the player
              section.
            </p>
          )}
        </div>

        <div className='divider'></div>

        <div>
          <h2 className='font-bold uppercase'>Player · Unlock & Play</h2>

          <div className='my-5'>
            <input
              className='file-input'
              type='file'
              onChange={e => setPlayerEncryptedFile(e.target.files?.[0] ?? null)}
            />
          </div>

          <div>
            <fieldset className='fieldset'>
              <legend className='fieldset-legend'>Manifest JSON (paste from creator)</legend>
              <textarea
                className='textarea w-128'
                value={playerManifestJson}
                onChange={e => setPlayerManifestJson(e.target.value)}
                rows={15}
                />
            </fieldset>
          </div>

          <div>
            <fieldset className='fieldset'>
              <legend className='fieldset-legend'>Envelope JSON (paste from creator)</legend>
              <textarea
                className='textarea w-128'
                value={playerEnvelopeJson}
                onChange={e => setPlayerEnvelopeJson(e.target.value)}
                rows={17}
              />
            </fieldset>
          </div>

          <button
            className='btn btn-secondary my-5'
            onClick={handlePlayerUnlockAndPlay}>
              Unlock & play
          </button>

          {playerAudioUrl && (
            <div>
              <audio src={playerAudioUrl} controls autoPlay />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Both