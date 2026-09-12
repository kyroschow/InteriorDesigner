import { Navigate, Route, Routes } from 'react-router-dom'
import { HomeScreen } from '@/screens/HomeScreen'
import { ProjectsScreen } from '@/screens/ProjectsScreen'
import { UnitsScreen } from '@/screens/UnitsScreen'
import { CreateScreen } from '@/screens/CreateScreen'
import { ProjectLayout } from '@/screens/ProjectLayout'
import { WorkspaceScreen } from '@/screens/WorkspaceScreen'
import { RulesScreen } from '@/screens/RulesScreen'
import { ExportScreen } from '@/screens/ExportScreen'
import { PreviewScreen } from '@/screens/PreviewScreen'

export function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeScreen />} />
      <Route path="/projects" element={<ProjectsScreen />} />
      <Route path="/new" element={<UnitsScreen />} />
      <Route path="/setup" element={<CreateScreen />} />
      <Route path="/projects/:projectId/preview" element={<PreviewScreen />} />
      <Route path="/projects/:projectId" element={<ProjectLayout />}>
        <Route index element={<WorkspaceScreen />} />
        <Route path="rules" element={<RulesScreen />} />
        <Route path="export" element={<ExportScreen />} />
      </Route>
      {/* The old id-less workspace can't be restored; send people to their project list. */}
      <Route path="/project/*" element={<Navigate to="/projects" replace />} />
    </Routes>
  )
}
