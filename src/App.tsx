import { Routes, Route } from 'react-router'
import Publish from './routes/Publish'
import Play from './routes/Play'
import Share from './routes/Share'
import Id from './routes/Id'
import Both from './routes/Both'

function App() {
  return (
    <div>
      <Routes>
        <Route path='id' element={<Id />} />
        <Route path='publish' element={<Publish />} />
        <Route path='play' element={<Play />} />
        <Route path='share' element={<Share />} />
        <Route path='both' element={<Both />} />
      </Routes>
    </div>
  )
}

export default App
