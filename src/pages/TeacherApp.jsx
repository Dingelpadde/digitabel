import { Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import TeacherLogin from '../components/teacher/TeacherLogin'
import TeacherDashboard from '../components/teacher/TeacherDashboard'
import StudentDetail from '../components/teacher/StudentDetail'

export default function TeacherApp() {
  const [authenticated, setAuthenticated] = useState(() => {
    return sessionStorage.getItem('digitabel_teacher') === 'true'
  })

  const handleLogin = () => {
    sessionStorage.setItem('digitabel_teacher', 'true')
    setAuthenticated(true)
  }

  const handleLogout = () => {
    sessionStorage.removeItem('digitabel_teacher')
    setAuthenticated(false)
  }

  if (!authenticated) {
    return <TeacherLogin onLogin={handleLogin} />
  }

  return (
    <Routes>
      <Route path="/" element={<TeacherDashboard onLogout={handleLogout} />} />
      <Route path="/student/:studentId" element={<StudentDetail onLogout={handleLogout} />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  )
}
