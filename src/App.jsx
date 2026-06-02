import { Routes, Route, Navigate } from 'react-router-dom'
import { StudentProvider } from './contexts/StudentContext'
import Landing from './pages/Landing'
import StudentApp from './pages/StudentApp'
import TeacherApp from './pages/TeacherApp'

export default function App() {
  return (
    <StudentProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/student/*" element={<StudentApp />} />
        <Route path="/teacher/*" element={<TeacherApp />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </StudentProvider>
  )
}
