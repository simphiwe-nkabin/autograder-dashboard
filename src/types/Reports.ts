// ../types/Reports.ts
export interface Deliverable {
  activityType(activityType: unknown): import("react").ReactNode;
  title: string;
  status: 'On time' | 'Late' | 'Missed' | 'Pending';
  score?: number;
  submittedDate: string;
  lateDays: number;
}

export interface LearnerStats {
  done: number;
  late: number;
  missed: number;
  strikes: number;
}

export interface Learner {
  id: string;
  name: string;
  cohort: string;
  deliverables: Deliverable[];
  stats: LearnerStats;
}