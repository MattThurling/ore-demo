import { useEffect, useState } from 'react'
import { Share } from 'lucide-react'
import { encode } from '../utils/idEncoding'

import { 
  initVault,
  type OreVault
} from '@mattthurling/ore'

interface OreId {
  version: 'ore-id-0.1'
  id: string
  publicEncryptionKey: JsonWebKey
}


function shareId(data: unknown) {
  const json = JSON.stringify(data, null, 2)
  const b58 = encode(json)
  console.log(b58)
  const message = `Hi! This is my Ore ID\n\n\n${window.location.origin}/share?id=${b58}`
  const href =
    "https://wa.me/?text=" +
    encodeURIComponent(message)
  window.open(href, '_blank')
}

function Id() {
  const [vault, setVault] = useState<OreVault | null>(null)
  const [oreId, setOreId] = useState<OreId | null>(null)

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

    try {
      console.log('Creating ORE ID…')

      const pubJwk = await vault.getPublicEncryptionKeyJwk()
      const id = crypto.randomUUID()

      const oreIdObj: OreId = {
        version: 'ore-id-0.1',
        id,
        publicEncryptionKey: pubJwk,
      }

      setOreId(oreIdObj)
      console.log(oreIdObj)
      console.log('ORE ID created')
    } catch (err) {
      console.error(err)
    }
  }
  return (
    <div className='p-8'>
      <p className='text'>
        Create an Ore Id (basically a keypair stored locally in the browser) so that artists can share their music with you.
      </p>
      <div className='divider'></div>
      
      <div>
        <button
          className='btn btn-secondary w-full md:w-1/2'
          onClick={handleCreateOreId}>
          Create ORE ID
        </button>
      </div>
      <div>
        {oreId && (
          <div>
             <p className='text-center my-6 font-mono text-sm md:text-lg md:text-left'>{oreId.id}</p>

            <button
              className='btn btn-outline w-full md:w-1/2' onClick={() => shareId(oreId)}>
                <Share />Share
            </button>
          </div>
        )}
      </div>
    </div>

  )
}

export default Id