
export interface Learner {
  name: string;
  cohort: string;
  stats: {
    done: number;
    late: number;
    missed: number;
    strikes: number;
  };
  deliverables: Array<{
    title: string;
    score?: number;
    submittedDate?: string;
    status: string;
    lateDays?: number;
  }>;
}



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

