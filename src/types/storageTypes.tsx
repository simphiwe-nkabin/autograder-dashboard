type Submission = {
    id: number,
    submission_id: number,
    blocked: boolean,
    comment: string | null,
    created_at: string,
    updated_at: string
}

export type { Submission }