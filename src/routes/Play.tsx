import { decode } from '../utils/idEncoding'
import { createHeliaContext, getEncryptedBytes } from '../utils/useHelia'

import { useSearchParams } from 'react-router'

function Play() {
  const [searchParams] = useSearchParams()
  const track = searchParams.get('track')

  const json = track ? decode(track) : null
  const trackObj = JSON.parse(json)
  console.log(trackObj)

  async function downloadAndDecrypt() {
    const { fs } = await createHeliaContext()
    const bytes = await getEncryptedBytes(fs, trackObj.c)
    console.log(bytes)
  }

  

  return (
    <div className='p-8'>
      <h1 className='text-3xl'>ORE | Player</h1>
      <div className='divider'></div>
      <button className='btn btn-secondary' onClick={downloadAndDecrypt}>Download</button>
      <div>{trackObj.c}</div>
    </div>
  )
}

export default Play