type BlockedSubmission = {
    id: number,
    submission_id: number,
    comment: string,
    created_at: number
}

export type { BlockedSubmission }

export interface AutogradeWorkerLog {
  id: number;
  created_at: string;
  submission_id: number;
  user_id: number;
  submission_status: string;
  course_id: number;
  assignment_id: number;
  assignment_name: string;
  assignment_intro: string;
  assignment_activity: string;
  submission_content: string;
  submitted_at: string | null;
  autograde_status: string;
  autograde_status_details: string;
  cmid: number;
}
