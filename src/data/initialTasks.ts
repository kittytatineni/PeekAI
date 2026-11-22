
import type { Task } from '../types'

export const initialTasks: Task[] = [
  {
    id: 1,
    title: 'Complete programming assignment',
    course: 'COMP2521',
    time: '60 min',
    priority: 'High',
    completed: false
  },
  {
    id: 2,
    title: 'Revise graph algorithms',
    course: 'COMP2521',
    time: '45 min',
    priority: 'Medium',
    completed: false
  },
  {
    id: 3,
    title: 'Watch missed lecture',
    course: 'MATH1081',
    time: '40 min',
    priority: 'Low',
    completed: true
  }
]
