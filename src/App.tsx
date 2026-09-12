import { Route, Routes } from 'react-router-dom'
import { UnitsScreen } from '@/screens/UnitsScreen'
import { CreateScreen } from '@/screens/CreateScreen'
import { ProjectLayout } from '@/screens/ProjectLayout'
import { WorkspaceScreen } from '@/screens/WorkspaceScreen'
import { RulesScreen } from '@/screens/RulesScreen'
import { ExportScreen } from '@/screens/ExportScreen'
import { ShoppingListScreen } from '@/screens/ShoppingListScreen'

export function App() {
  return (
    <Routes>
      <Route path="/" element={<UnitsScreen />} />
      <Route path="/setup" element={<CreateScreen />} />
      <Route path="/project" element={<ProjectLayout />}>
        <Route index element={<WorkspaceScreen />} />
        <Route path="rules" element={<RulesScreen />} />
        <Route path="export" element={<ExportScreen />} />
        <Route path="shopping-list" element={<ShoppingListScreen />} />
      </Route>
    </Routes>
  )
}
