export default function Home() {
  return (
    <div className='p-8 space-y-4'>
      <h1 className='text text-secondary text-2xl'>Open Rights Engine</h1>
      <p>A new way to distribute music that puts the creators in control.</p>
      <h2 className='font-bold'>Getting started as a creator</h2>
      <p>Got a track you want to share? First step is to <a className='link' href='/publish'>publish</a> the audio file to <a className='link' href='https://en.wikipedia.org/wiki/InterPlanetary_File_System'>IPFS</a>.</p>
      <p>The track is locked until you explicitly grant permission. To do that, you take your chosen listener's <a href='/id' className='link'>ORE Id</a> and <a href='/share' className='link'>issue an 'envelope'</a> containing the key to unlock the track.</p>
      <h2 className='font-bold'>Getting started as a listener</h2>
      <p>Create a unique <a href='/id' className='link'>ORE Id</a> and share it with your favourite creators.</p>
      <p><a href='/play' className='link'>Unlock and play their music</a> on your device.</p>
    </div>
    
  )
}