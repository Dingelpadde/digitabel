import { Routes, Route, Navigate } from 'react-router-dom'
import { StudentProvider } from './contexts/StudentContext'
import Landing from './pages/Landing'
import StudentApp from './pages/StudentApp'
import TeacherApp from './pages/TeacherApp'
import ProjectPlanPage from './pages/ProjectPlanPage'

export default function App() {
  return (
    <StudentProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/student/*" element={<StudentApp />} />
        <Route path="/project" element={<ProjectPlanPage />} />
        {/* Admin-rute — ingen lenke fra studentgrensesnittet */}
        <Route path="/admin/*" element={<TeacherApp />} />
        {/* Gammel /teacher-rute redirecter stille til /admin */}
        <Route path="/teacher/*" element={<Navigate to="/admin" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </StudentProvider>
  )
}
