
export interface Deliverable {
  title: string;
  status: 'On time' | 'Late' | 'Missed' | 'Pending';
  score?: number; 
}

export interface LearnerStats {
  done: number;
  late: number;
  missed: number;
  strikes: number;
}

export interface LearnerReport {
  name: string;
  deliverables: Deliverable[];
  stats: LearnerStats;
}

export interface CohortReport {
  id: string;
  name: string;
  learners: LearnerReport[];
}

