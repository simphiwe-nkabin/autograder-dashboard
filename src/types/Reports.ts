// ../types/Reports.ts
export interface Deliverable {
  activityType: string;
  title: string;
  status: 'ontime' | 'late' | 'missed' | 'pending';
  score: number | null;
  submittedDate: Date | null;
}

export interface LearnerStats {
  done: number;
  late: number;
  missed: number;
  strikes: number;
}

export interface Learner {
  id: number;
  name: string;
  cohort: string;
  deliverables: Deliverable[];
  stats: LearnerStats;
}


export interface MoodleRawRecord {
  groupname: string;
  userid: string;
  firstname: string;
  lastname: string;
  activityname: string;
  grade: number | null;
  duedate: Date | null;
  submissiondate: Date | null;
  activitytype: string;
  submissionstatus: 'ontime' | 'pending' | 'missed' | 'late'
}

export type GradeRecord = {
  uid: string;
  coursename: string;
  groupname: string;
  userid: number;
  firstname: string;
  lastname: string;
  activitytype: string;
  activityname: string;
  grade: number | null;
  duedate: Date | null;
  submissiondate: Date | null;
  submissionstatus: 'ontime' | 'pending' | 'missed' | 'late';
}