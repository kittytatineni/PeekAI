
import type { Course } from '../types'

export const initialCourses: Course[] = [
  {
    id: 1,
    code: 'COMP2521',
    name: 'Data Structures and Algorithms',
    description: 'Programming, algorithms and problem solving.',
    color: 'blue',
    assessments: [
      {
        id: 1,
        title: 'Programming Assignment 2',
        dueDate: '17 November 2026',
        weight: '25%',
        status: 'In progress'
      },
      {
        id: 2,
        title: 'Final Examination',
        dueDate: '3 December 2026',
        weight: '50%',
        status: 'Upcoming'
      }
    ]
  },
  {
    id: 2,
    code: 'MATH1081',
    name: 'Discrete Mathematics',
    description: 'Logic, combinatorics and graph theory.',
    color: 'purple',
    assessments: [
      {
        id: 3,
        title: 'Mathematics Quiz 3',
        dueDate: '22 November 2026',
        weight: '10%',
        status: 'Upcoming'
      }
    ]
  },
  {
    id: 3,
    code: 'SENG2021',
    name: 'Software Engineering',
    description: 'Software development processes and engineering.',
    color: 'orange',
    assessments: [
      {
        id: 4,
        title: 'Project Submission',
        dueDate: '28 November 2026',
        weight: '30%',
        status: 'Upcoming'
      }
    ]
  }
]
