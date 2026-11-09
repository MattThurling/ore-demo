import { Routes, Route } from 'react-router'
import Nav from './components/Nav'
import Home from './routes/Home'
import Share from './routes/Share'
import Publish from './routes/Publish'
import Play from './routes/Play'

import Id from './routes/Id'
import Both from './routes/Both'
import { Glasses } from 'lucide-react'
import { useUIStore } from './state/uiStore'


function App() {
  const nerdMode = useUIStore(s => s.nerdMode)
  const setNerdMode = useUIStore(s => s.setNerdMode) 
  return (
    <div className='pb-24'>
      <Nav />
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='id' element={<Id />} />
        <Route path='publish' element={<Publish />} />
        <Route path='play' element={<Play />} />
        <Route path='share' element={<Share />} />
        <Route path='both' element={<Both />} />
      </Routes>

      {/* Nerd-mode toggle. Fixed to the corner only: a full-width bar here would sit over
          page content and swallow clicks on anything near the bottom of the viewport. */}
      <div className='fixed bottom-8 right-8 z-50'>
        <div className='flex items-center'>
          <div className={ nerdMode ? 'text-secondary' : 'text-gray-300' }>
            <Glasses />
          </div>       
          <input
            type='checkbox'
            checked={nerdMode}
            onChange={(e) => setNerdMode(e.target.checked)}
            className='toggle toggle-md ml-4' />
        </div>
      </div>
      
    </div>
  )
}

export default App
