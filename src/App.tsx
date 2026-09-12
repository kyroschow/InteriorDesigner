import { Route, Routes } from 'react-router-dom'
import { UnitsScreen } from '@/screens/UnitsScreen'
import { CreateScreen } from '@/screens/CreateScreen'
import { WorkspaceScreen } from '@/screens/WorkspaceScreen'
import { RulesScreen } from '@/screens/RulesScreen'
import { ExportScreen } from '@/screens/ExportScreen'

export function App() {
  return (
    <Routes>
      <Route path="/" element={<UnitsScreen />} />
      <Route path="/setup" element={<CreateScreen />} />
      <Route path="/project" element={<WorkspaceScreen />} />
      <Route path="/project/rules" element={<RulesScreen />} />
      <Route path="/project/export" element={<ExportScreen />} />
    </Routes>
  )
}
