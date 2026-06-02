import { Routes, Route, Navigate } from 'react-router-dom'
import { useStudent } from '../contexts/StudentContext'
import StudentLogin from '../components/student/StudentLogin'
import AssignmentList from '../components/student/AssignmentList'
import AssignmentDetail from '../components/student/AssignmentDetail'

export default function StudentApp() {
  const { student } = useStudent()

  if (!student) {
    return (
      <Routes>
        <Route path="/" element={<StudentLogin />} />
        <Route path="*" element={<Navigate to="/student" replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<AssignmentList />} />
      <Route path="/assignment/:assignmentId" element={<AssignmentDetail />} />
      <Route path="*" element={<Navigate to="/student" replace />} />
    </Routes>
  )
}
