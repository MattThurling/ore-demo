import { useUIStore } from "../state/uiStore"
import { Link } from "react-router"

export default function Home() {
  const nerdMode = useUIStore(s => s.nerdMode)
  return (
    <div className='p-8 space-y-4'>
      <h1 className='text text-secondary text-2xl'>Open Rights Engine</h1>
      <p>A new way to distribute music that puts the creators in control.</p>
      <h2 className='font-bold'>Getting started as a creator</h2>
      <p>Got a track you want to share? First step is to <Link className='link' to='/publish'>publish</Link> the audio file to <Link className='link' to='https://en.wikipedia.org/wiki/InterPlanetary_File_System'>IPFS</Link>.</p>
      <p>The track is locked until you explicitly grant permission. To do that, you take your chosen listener's <Link className='link' to='/id'>ORE Id</Link> and <Link to='/share' className='link'>issue an 'envelope'</Link> containing the key to unlock the track.</p>
      <h2 className='font-bold'>Getting started as a listener</h2>
      <p>Create a unique <Link to='/id' className='link'>ORE Id</Link> and share it with your favourite creators.</p>
      <p><Link to='/play' className='link'>Unlock and play their music</Link> on your device.</p>
      <h2 className='font-bold'>Platforms</h2>
      <p>A platform such as Versions has an ORE Id too. <Link to='/share' className='link'>Issue it an envelope</Link> with licence terms and it can play the track and pay every contributor by the split rule declared in the track's rights record.</p>
      <h2 className='font-bold'>Nerd mode</h2>
      <p>Toggle nerd mode (bottom right) if you're interested what's going on behind the scenes.</p>
      {nerdMode && (
        <div className='text-sm font-mono space-y-4 mt-6'>
          <div className='divider'></div>
          <p>Nerd mode enabled!</p>
        </div>
      )}

    </div>
    
  )
}