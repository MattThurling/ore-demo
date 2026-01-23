import { useEffect, useState } from 'react'
import { Share } from 'lucide-react'
import { createStorage } from '../oreStorage/oreStorageFactory'
import { type OreId } from '../types/ore'
import { useUIStore } from '../state/uiStore'

const oreStorage = createStorage(import.meta.env.VITE_STORAGE_TYPE)

import { 
  initVault,
  type OreVault
} from '@mattthurling/ore'


function shareId(id: string) {
  const message = `Hi! This is my Ore ID\n${window.location.origin}/share?id=${id}`
  const href =
    "https://wa.me/?text=" +
    encodeURIComponent(message)
  window.open(href, '_blank')
}

function Id() {
  const [vault, setVault] = useState<OreVault | null>(null)
  const [idId, setIdId] = useState<string>('')
  const [idName, setIdName] = useState<string>('')
  const [status, setStatus] = useState<'' | 'uploading' | 'published'>('')
  const nerdMode = useUIStore(s => s.nerdMode)


  useEffect(() => {
    ;(async () => {
      try {
        const v = await initVault()
        setVault(v)
      } catch (err) {
        console.error(err)
      }
    })()
  }, [])

  async function handleCreateOreId() {
    if (!vault) {
      console.log('Vault not ready')
      return
    }
    setStatus('uploading')
    try {
      console.log('Creating ORE ID…')
      // Create a keypair in browser local storage and get the public key
      const pubJwk = await vault.getPublicEncryptionKeyJwk()
      // Prepare the oreId
      const oreIdObj: OreId = {
        version: '0.0.1',
        idName,
        publicEncryptionKey: pubJwk,
      }
      // Convert to JSON
      const oreIdJson = JSON.stringify(oreIdObj, null, 2)
      // Wrap it in a FormData object
      const oreIdFormData = new FormData()
      const oreIdBlob = new Blob([oreIdJson], { type: 'application/json'})
      oreIdFormData.append('file', oreIdBlob, idName)
      // Write to specified storage
      const oId = await oreStorage!.write(oreIdFormData)
      if (oId) setIdId(oId); else return
    } catch (err) {
      console.error(err)
    }
  }
  return (
    <div className='p-8'>
      <p className='text'>
        Create an OreId so artists can share their music with you.
      </p>
      <div className='divider'></div>
      <div className='md:flex md:gap-6'>
        <div className='md:flex-1'>
          <input
            className='input w-full'
            type='text'
            placeholder='Enter a name'
            onChange={e => setIdName(e.target.value)}
          />
        </div>
        <div className='mt-6 md:mt-0 md:flex-1' >
          <button
            className='btn btn-secondary w-full'
            disabled={!idName || !!status}
            onClick={handleCreateOreId}>
            Create OreId
          </button>
        </div>
      </div>
      
      {idId && (
        <div>
          <div className='divider'></div>
          <p className='text'>
            Your OreId has been published to the InterPlanetary File System!
          </p>
          <div className='mt-6'>
            <a href={`https://ipfs.io/ipfs/${idId}`} className='hover-3d mx-2 cursor-pointer'>
              <div className='card w-full bg-black text-white'>
                <div className='card-body'>
                  <div className='card-title'>
                    {idName}
                  </div>
                  <p>{idId}</p>
                </div>
              </div>
            </a>
          </div>
          <div>
            <button
              className='btn btn-outline w-full mt-6 md:w-1/2' onClick={() => shareId(idId)}>
                <Share />Share
            </button>
          </div>
        </div>
      )}
      {nerdMode && (
        <div className='text-sm font-mono space-y-4 mt-6'>
          <div className='divider'></div>
          <p>Uses the browser's built-in <a className='link' href='https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API'>Web Crypto API</a> to generate a unique keypair. The private key is stored in the browser's local storage. A public key is then written to <a className='link' href='https://en.wikipedia.org/wiki/InterPlanetary_File_System'>IPFS</a> as JSON.</p>
          <p>The ID can be shared, enabling other users /platforms to encrypt content for this device only.</p>
        </div>
      )}
    </div>

  )
}

export default Id