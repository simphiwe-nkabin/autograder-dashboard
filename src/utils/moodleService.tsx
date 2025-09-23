import type { CourseType, SubmissionType } from "../types/EntityTypes";
import { type MoodleAssignmentType, type MoodleCourseType, type MoodleSubmissionType } from "../types/moodleDataTypes"

const WSFunctions = {
    core_course_get_courses: "core_course_get_courses",
    mod_assign_get_assignments: "mod_assign_get_assignments",
    mod_assign_get_submissions: "mod_assign_get_submissions",
    core_enrol_get_enrolled_users: "core_enrol_get_enrolled_users",
    mod_quiz_get_quizzes_by_courses: "mod_quiz_get_quizzes_by_courses",
    mod_quiz_get_user_quiz_attempts: "mod_quiz_get_user_quiz_attempts"
}

function getUrl(wsfunction: string) {
    return `${import.meta.env.VITE_MOODLE_BASEURL}?wstoken=${import.meta.env.VITE_MOODLE_WEB_TOKEN}&wsfunction=${wsfunction}&moodlewsrestformat=json`
}

async function getCourses(): Promise<CourseType[]> {
    const response = await fetch(getUrl(WSFunctions.core_course_get_courses))
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result: MoodleCourseType[] = await response.json();
    return result.map((item: MoodleCourseType) => ({
        id: item.id,
        name: item.shortname,
        createdAt: item.timecreated
    }));
}

async function getSubmissions(): Promise<SubmissionType[]> {
    const assignments = []

    const response = await fetch(getUrl(WSFunctions.mod_assign_get_assignments))
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: MoodleAssignmentType = await response.json();
    for (let i = 0; i < result.courses.length; i++) {
        const course = result.courses[i];
        const courseName = course.shortname

        for (let j = 0; j < course.assignments.length; j++) {
            const assignment = course.assignments[j];

            assignments.push({
                courseId: assignment.course,
                courseName,
                coursModuleId: assignment.cmid,
                id: assignment.id,
                name: assignment.name
            })
        }
    }


    const submissions: SubmissionType[] = []
    for (let i = 0; i < assignments.length; i++) {
        const assigment = assignments[i];
        const response = await fetch(getUrl(WSFunctions.mod_assign_get_submissions) + `&assignmentids[0]=${assigment.id}`)
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const submissionsResult: MoodleSubmissionType = await response.json();
        const moodleSubmissions = submissionsResult.assignments[0].submissions
        for (let j = 0; j < moodleSubmissions.length; j++) {

            const moodleSubmission = moodleSubmissions[j];
            submissions.push({
                courseId: assigment.courseId,
                courseName: assigment.courseName,
                coursModuleId: assigment.coursModuleId,
                assignmentId: assigment.id,
                assignmentName: assigment.name,
                id: moodleSubmission.id,
                userId: moodleSubmission.userid,
                attemptNumber: moodleSubmission.attemptnumber,
                submittedAt: moodleSubmission.timecreated * 1000,
                status: moodleSubmission.status,
                gradingStatus: moodleSubmission.gradingstatus
            })
        }
    }

    return submissions;
}
export default { getCourses, getSubmissions }