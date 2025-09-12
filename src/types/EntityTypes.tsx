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
    assignmentId: number,
    assignmentName: string,
    userId: number,
    attemptNumber: number,
    submittedAt: number,
    status: string,
    gradingStatus: string
}

export type { CourseType, SubmissionType }