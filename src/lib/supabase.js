import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase env vars not set — running in demo mode without persistence.')
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
)

// ─── Students ────────────────────────────────────────────────────────────────

export async function getStudents() {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .order('name')
  if (error) throw error
  return data
}

export async function upsertStudent({ name, email, consent_given_at, kull }) {
  const { data, error } = await supabase
    .from('students')
    .upsert({ name, email, consent_given_at, kull }, { onConflict: 'email' })
    .select()
    .single()
  if (error) throw error
  return data
}

// ─── Student Assignments ─────────────────────────────────────────────────────

export async function getStudentAssignments(studentId) {
  const { data, error } = await supabase
    .from('student_assignments')
    .select('*')
    .eq('student_id', studentId)
  if (error) throw error
  return data
}

export async function getAllStudentAssignments() {
  const { data, error } = await supabase
    .from('student_assignments')
    .select('*, students(name), assignments(title, order_index)')
  if (error) throw error
  return data
}

export async function upsertStudentAssignment({ studentId, assignmentId, status }) {
  const now = new Date().toISOString()
  const updates = {
    student_id: studentId,
    assignment_id: assignmentId,
    status,
    ...(status === 'in_progress' ? { started_at: now } : {}),
    ...(status === 'cleared' ? { cleared_at: now } : {}),
  }
  const { data, error } = await supabase
    .from('student_assignments')
    .upsert(updates, { onConflict: 'student_id,assignment_id' })
    .select()
    .single()
  if (error) throw error
  return data
}

// ─── Prep Answers ─────────────────────────────────────────────────────────────

export async function savePrepAnswers(studentAssignmentId, answers) {
  // answers: [{ question_index, question_text, answer }]
  const rows = answers.map((a) => ({ student_assignment_id: studentAssignmentId, ...a }))
  const { error } = await supabase.from('prep_answers').insert(rows)
  if (error) throw error
}

export async function getPrepAnswers(studentAssignmentId) {
  const { data, error } = await supabase
    .from('prep_answers')
    .select('*')
    .eq('student_assignment_id', studentAssignmentId)
    .order('question_index')
  if (error) throw error
  return data
}

// ─── Chat Messages ────────────────────────────────────────────────────────────

export async function getChatMessages(studentAssignmentId) {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('student_assignment_id', studentAssignmentId)
    .order('created_at')
  if (error) throw error
  return data
}

export async function saveChatMessage(studentAssignmentId, role, content) {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({ student_assignment_id: studentAssignmentId, role, content })
    .select()
    .single()
  if (error) throw error
  return data
}

// ─── Synopsis ─────────────────────────────────────────────────────────────────

export async function saveSynopsis(studentAssignmentId, synopsis) {
  const { error } = await supabase
    .from('student_assignments')
    .update({ synopsis })
    .eq('id', studentAssignmentId)
  if (error) throw error
}

export async function getSynopsis(studentAssignmentId) {
  const { data, error } = await supabase
    .from('student_assignments')
    .select('synopsis')
    .eq('id', studentAssignmentId)
    .single()
  if (error) throw error
  return data?.synopsis || null
}

// ─── Reflections ──────────────────────────────────────────────────────────────

export async function saveReflection(studentAssignmentId, { whatLearned, whatChanged, whatDifferently }) {
  const { data, error } = await supabase
    .from('reflections')
    .upsert(
      {
        student_assignment_id: studentAssignmentId,
        what_learned: whatLearned,
        what_changed: whatChanged,
        what_differently: whatDifferently,
      },
      { onConflict: 'student_assignment_id' }
    )
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getReflection(studentAssignmentId) {
  const { data, error } = await supabase
    .from('reflections')
    .select('*')
    .eq('student_assignment_id', studentAssignmentId)
    .maybeSingle()
  if (error) throw error
  return data
}
