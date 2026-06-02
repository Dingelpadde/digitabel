import { createContext, useContext, useState, useEffect } from 'react'

const StudentContext = createContext(null)

export function StudentProvider({ children }) {
  const [student, setStudent] = useState(() => {
    try {
      const stored = localStorage.getItem('digitabel_student')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  const login = (studentData) => {
    setStudent(studentData)
    localStorage.setItem('digitabel_student', JSON.stringify(studentData))
  }

  const logout = () => {
    setStudent(null)
    localStorage.removeItem('digitabel_student')
  }

  return (
    <StudentContext.Provider value={{ student, login, logout }}>
      {children}
    </StudentContext.Provider>
  )
}

export function useStudent() {
  const ctx = useContext(StudentContext)
  if (!ctx) throw new Error('useStudent must be used within StudentProvider')
  return ctx
}
