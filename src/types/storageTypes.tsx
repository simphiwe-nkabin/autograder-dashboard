

type Submission = {
    id: number,
    submission_id: number,
    blocked: boolean,
    comment: string | null,
    created_at: string,
    updated_at: string
}

export type { Submission };


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
