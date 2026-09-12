import { Route, Routes } from 'react-router-dom'
import { UnitsScreen } from '@/screens/UnitsScreen'
import { CreateScreen } from '@/screens/CreateScreen'
import { WorkspaceScreen } from '@/screens/WorkspaceScreen'

export function App() {
  return (
    <Routes>
      <Route path="/" element={<UnitsScreen />} />
      <Route path="/setup" element={<CreateScreen />} />
      <Route path="/project" element={<WorkspaceScreen />} />
    </Routes>
  )
}
