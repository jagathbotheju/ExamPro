import { pgTable, uuid, text, boolean, integer, jsonb, timestamp, date } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const studentProfiles = pgTable('student_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull().unique(),
  name: text('name').notNull(),
  email: text('email'),
  school: text('school'),
  grade: text('grade'),
  dateOfBirth: date('date_of_birth'),
  sex: text('sex'),
  isComplete: boolean('is_complete').default(false).notNull(),
  studyStreak: integer('study_streak').default(0).notNull(),
  bestStreak: integer('best_streak').default(0).notNull(),
  lastStudyDate: date('last_study_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const subjects = pgTable('subjects', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  color: text('color').notNull(),
  icon: text('icon').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const grades = pgTable('grades', {
  id: uuid('id').defaultRandom().primaryKey(),
  label: text('label').notNull().unique(),
  order: integer('order').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const questions = pgTable('questions', {
  id: uuid('id').defaultRandom().primaryKey(),
  body: text('body').notNull(),
  options: jsonb('options').$type<string[]>().notNull(),
  correctIndex: integer('correct_index').notNull(),
  subjectId: uuid('subject_id').references(() => subjects.id, { onDelete: 'set null' }),
  gradeId: uuid('grade_id').references(() => grades.id, { onDelete: 'set null' }),
  difficulty: text('difficulty').default('Medium').notNull(),
  usesCount: integer('uses_count').default(0).notNull(),
  imageUrl: text('image_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const exams = pgTable('exams', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  subjectId: uuid('subject_id').references(() => subjects.id, { onDelete: 'set null' }),
  gradeId: uuid('grade_id').references(() => grades.id, { onDelete: 'set null' }),
  durationMinutes: integer('duration_minutes').notNull(),
  status: text('status').default('draft').notNull(),
  createdBy: text('created_by').notNull(),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const examQuestions = pgTable('exam_questions', {
  id: uuid('id').defaultRandom().primaryKey(),
  examId: uuid('exam_id').notNull().references(() => exams.id, { onDelete: 'cascade' }),
  questionId: uuid('question_id').notNull().references(() => questions.id, { onDelete: 'cascade' }),
  order: integer('order').notNull(),
});

export const examAssignments = pgTable('exam_assignments', {
  id: uuid('id').defaultRandom().primaryKey(),
  examId: uuid('exam_id').notNull().references(() => exams.id, { onDelete: 'cascade' }),
  studentId: uuid('student_id').notNull().references(() => studentProfiles.id, { onDelete: 'cascade' }),
  assignedAt: timestamp('assigned_at').defaultNow().notNull(),
  status: text('status').default('pending').notNull(),
});

export const examSubmissions = pgTable('exam_submissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  examId: uuid('exam_id').notNull().references(() => exams.id, { onDelete: 'cascade' }),
  studentId: uuid('student_id').notNull().references(() => studentProfiles.id, { onDelete: 'cascade' }),
  answers: jsonb('answers').$type<Record<string, number>>().notNull(),
  score: integer('score').notNull(),
  correctCount: integer('correct_count').notNull(),
  totalQuestions: integer('total_questions').notNull(),
  timeSpentSeconds: integer('time_spent_seconds'),
  submittedAt: timestamp('submitted_at').defaultNow().notNull(),
});

export const incorrectAnswers = pgTable('incorrect_answers', {
  id: uuid('id').defaultRandom().primaryKey(),
  studentId: uuid('student_id').notNull().references(() => studentProfiles.id, { onDelete: 'cascade' }),
  questionId: uuid('question_id').notNull().references(() => questions.id, { onDelete: 'cascade' }),
  subjectId: uuid('subject_id').references(() => subjects.id, { onDelete: 'set null' }),
  lastIncorrectAt: timestamp('last_incorrect_at').defaultNow().notNull(),
  incorrectCount: integer('incorrect_count').default(1).notNull(),
  resolvedAt: timestamp('resolved_at'),
});

// Relations
export const studentProfilesRelations = relations(studentProfiles, ({ many }) => ({
  assignments: many(examAssignments),
  submissions: many(examSubmissions),
  incorrectAnswers: many(incorrectAnswers),
}));

export const subjectsRelations = relations(subjects, ({ many }) => ({
  questions: many(questions),
  exams: many(exams),
}));

export const gradesRelations = relations(grades, ({ many }) => ({
  questions: many(questions),
  exams: many(exams),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
  subject: one(subjects, { fields: [questions.subjectId], references: [subjects.id] }),
  grade: one(grades, { fields: [questions.gradeId], references: [grades.id] }),
  examQuestions: many(examQuestions),
  incorrectAnswers: many(incorrectAnswers),
}));

export const examsRelations = relations(exams, ({ one, many }) => ({
  subject: one(subjects, { fields: [exams.subjectId], references: [subjects.id] }),
  grade: one(grades, { fields: [exams.gradeId], references: [grades.id] }),
  examQuestions: many(examQuestions),
  assignments: many(examAssignments),
  submissions: many(examSubmissions),
}));

export const examQuestionsRelations = relations(examQuestions, ({ one }) => ({
  exam: one(exams, { fields: [examQuestions.examId], references: [exams.id] }),
  question: one(questions, { fields: [examQuestions.questionId], references: [questions.id] }),
}));

export const examAssignmentsRelations = relations(examAssignments, ({ one }) => ({
  exam: one(exams, { fields: [examAssignments.examId], references: [exams.id] }),
  student: one(studentProfiles, { fields: [examAssignments.studentId], references: [studentProfiles.id] }),
}));

export const examSubmissionsRelations = relations(examSubmissions, ({ one }) => ({
  exam: one(exams, { fields: [examSubmissions.examId], references: [exams.id] }),
  student: one(studentProfiles, { fields: [examSubmissions.studentId], references: [studentProfiles.id] }),
}));

export const incorrectAnswersRelations = relations(incorrectAnswers, ({ one }) => ({
  student: one(studentProfiles, { fields: [incorrectAnswers.studentId], references: [studentProfiles.id] }),
  question: one(questions, { fields: [incorrectAnswers.questionId], references: [questions.id] }),
  subject: one(subjects, { fields: [incorrectAnswers.subjectId], references: [subjects.id] }),
}));
