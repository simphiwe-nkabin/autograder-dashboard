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

type AssignmentMetaType = {
    courseId: number,
    courseName: string,
    coursModuleId: number,
    id: number,
    name: string
}




export type { CourseType, SubmissionType, AssignmentMetaType, }