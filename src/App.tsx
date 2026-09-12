import { Route, Routes } from 'react-router-dom'
import { UnitsScreen } from '@/screens/UnitsScreen'
import { CreateScreen } from '@/screens/CreateScreen'
import { ProjectStub } from '@/screens/ProjectStub'

export function App() {
  return (
    <Routes>
      <Route path="/" element={<UnitsScreen />} />
      <Route path="/setup" element={<CreateScreen />} />
      <Route path="/project" element={<ProjectStub />} />
    </Routes>
  )
}
