type CourseType = {
    id: number,
    name: string,
    createdAt: number
}

type SubmissionType = {
    courseName: string,
    courseId: number,
    coursModuleId: number,
    id: number,
    submissionName: string,
    userId: number,
    attemptNumber: number,
    submittedAt: number,
    status: string,
    submissionType: "assignment" | "quiz"
    gradingUrl: string,
    courseUrl: string,
    moduleUrl: string
}

export type { CourseType, SubmissionType }