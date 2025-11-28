import { useEffect, useState } from 'react'
import { Copy, Share } from 'lucide-react'
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

function copyOreIdObj(data: unknown) {
  const str = JSON.stringify(data, null, 2)
  const b58 = encode(str)
  console.log(b58)
  navigator.clipboard.writeText(b58)
}

function Id() {
  const [vault, setVault] = useState<OreVault | null>(null)
  const [status, setStatus] = useState<string>('Ready')
  const [oreId, setOreId] = useState<OreId | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const v = await initVault()
        setVault(v)
      } catch (err) {
        console.error(err)
        setStatus('Failed to initialise ORE vault')
      }
    })()
  }, [])

  async function handleCreateOreId() {
    if (!vault) {
      setStatus('Vault not ready')
      return
    }

    try {
      setStatus('Creating ORE ID…')

      const pubJwk = await vault.getPublicEncryptionKeyJwk()
      const id = crypto.randomUUID()

      const oreIdObj: OreId = {
        version: 'ore-id-0.1',
        id,
        publicEncryptionKey: pubJwk,
      }

      setOreId(oreIdObj)
      setStatus('ORE ID created')
    } catch (err) {
      console.error(err)
      setStatus('Error creating ORE ID')
    }
  }
  return (
    <div className='p-8'>
      <h1 className='text-3xl'>ORE | Player</h1>
      <div className='divider'></div>
      <div className='flex items-center'>
        <div className='flex-1'>
          <button
            className='btn'
            onClick={handleCreateOreId}>
            Create ORE ID
          </button>
        </div>
        <div className='flex-2'>
          {oreId && (
          <div className='flex items-center'>
            <div>
              
                <p className='font-mono text-xl'>{oreId.id}</p>
            </div>
            <div className='ml-4'>
              <button
                className='btn btn-ghost' onClick={() => copyOreIdObj(oreId)}><Copy />
              </button>
            </div>
            <div>
              <button
                className='btn btn-ghost' onClick={() => shareId(oreId)}><Share />
              </button>
            </div>
          </div>
          )}
        </div>
      </div>
      <div className='divider'></div>
      <p>Status: {status}</p>
      <div className='divider'></div>
    </div>
  )
}

export default Id