

import type { LearnerReport } from "../types/Reports";


export const mockCohorts = [
  { id: 'coh_001', name: 'Data Science Cohort Q1 2026' },
  { id: 'coh_002', name: 'AI Fundamentals Cohort' },
  { id: 'coh_003', name: 'Machine Learning Bootcamp' }
];

export const mockReportData: Record<string, LearnerReport[]> = {
  coh_001: [
    {
      name: 'Anna Molefe',
      deliverables: [
        { title: 'Quiz: Exploring the Data and AI Landscape', status: 'On time', score: 85 },
        { title: 'Quiz: Data Science and Data Analytics', status: 'Late', score: 68 },
        { title: 'Quiz: The Data Science Workflow and Lifecycle', status: 'Pending' },
      ],
      stats: { done: 2, late: 1, missed: 0, strikes: 1 }
    },
    {
      name: 'Kabelo Khumalo',
      deliverables: [
        { title: 'Quiz: Exploring the Data and AI Landscape', status: 'On time', score: 72 },
        { title: 'Quiz: Data Science and Data Analytics', status: 'Missed' },
        { title: 'Quiz: The Data Science Workflow and Lifecycle', status: 'Pending' },
      ],
      stats: { done: 1, late: 0, missed: 1, strikes: 1 }
    },
    {
      name: 'Zanele Nkosi',
      deliverables: [
        { title: 'Quiz: Exploring the Data and AI Landscape', status: 'Missed' },
        { title: 'Quiz: Data Science and Data Analytics', status: 'Missed' },
        { title: 'Quiz: The Data Science Workflow and Lifecycle', status: 'Pending' },
      ],
      stats: { done: 0, late: 0, missed: 2, strikes: 2 }
    }
  ],
  coh_002: [
    {
      name: 'Thandiwe Dlamini',
      deliverables: [
        { title: 'Assignment: Introduction to Python', status: 'On time', score: 90 },
        { title: 'Forum: Week 1 Discussion', status: 'On time' },
        { title: 'H5P: Interactive Quiz', status: 'Late', score: 75 },
      ],
      stats: { done: 5, late: 1, missed: 0, strikes: 1 }
    }
  ],
  coh_003: []
};