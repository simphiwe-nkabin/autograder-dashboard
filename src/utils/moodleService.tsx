import type { CourseType, SubmissionType } from "../types/EntityTypes";
import { type MoodleAssignmentType, type MoodleCourseEnrolledUser, type MoodleCourseType, type MoodleQuizAttemptType, type MoodleQuizType, type MoodleSubmissionType } from "../types/moodleDataTypes"

const WSFunctions = {
    core_course_get_courses: "core_course_get_courses",
    mod_assign_get_assignments: "mod_assign_get_assignments",
    mod_assign_get_submissions: "mod_assign_get_submissions",
    core_enrol_get_enrolled_users: "core_enrol_get_enrolled_users",
    mod_quiz_get_quizzes_by_courses: "mod_quiz_get_quizzes_by_courses",
    mod_quiz_get_user_quiz_attempts: "mod_quiz_get_user_quiz_attempts",
    mod_quiz_get_quiz_required_qtypes: "mod_quiz_get_quiz_required_qtypes",
    core_course_get_enrolled_users_by_cmid: "core_course_get_enrolled_users_by_cmid",
    mod_quiz_get_user_attempts: "mod_quiz_get_user_attempts"
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

async function getAssignmentSubmissions(): Promise<SubmissionType[]> {
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
            if (moodleSubmission.status !== 'graded' && moodleSubmission.status == 'submitted') {
                submissions.push({
                    courseId: assigment.courseId,
                    courseName: assigment.courseName,
                    coursModuleId: assigment.coursModuleId,
                    submissionName: assigment.name,
                    id: moodleSubmission.id,
                    userId: moodleSubmission.userid,
                    attemptNumber: moodleSubmission.attemptnumber,
                    submittedAt: moodleSubmission.timecreated * 1000,
                    status: moodleSubmission.status,
                    submissionType: "assignment",
                    gradingUrl: `https://moodle.shaper.co.za/mod/assign/view.php?id=${assigment.coursModuleId}&action=grader&userid=${moodleSubmission.userid}`,
                    courseUrl: `https://moodle.shaper.co.za/course/view.php?id=${assigment.courseId}`,
                    moduleUrl: `https://moodle.shaper.co.za/mod/assign/view.php?id=${assigment.coursModuleId}`
                })
            }
        }
    }

    return submissions;
}

async function getAllQuizzes(): Promise<MoodleQuizType[]> {
    const response = await fetch(getUrl(WSFunctions.mod_quiz_get_quizzes_by_courses))
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const jsonRes: { quizzes: MoodleQuizType[] } = await response.json()
    return jsonRes.quizzes
}

async function getQuizQuestionTypes(quizId: number): Promise<string[]> {
    const response = await fetch(getUrl(WSFunctions.mod_quiz_get_quiz_required_qtypes) + `&quizid=${quizId}`)
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const jsonRes: { questiontypes: string[] } = await response.json()
    return jsonRes.questiontypes
}

async function getEnrolledUsersByCourseModule(cmid: number) {
    const response = await fetch(getUrl(WSFunctions.core_course_get_enrolled_users_by_cmid) + `&cmid=${cmid}`)
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const jsonRes: { users: MoodleCourseEnrolledUser[] } = await response.json()
    return jsonRes.users
}

async function getUserQuizAttempts(quizId: number, userId: number): Promise<MoodleQuizAttemptType[]> {
    const response = await fetch(getUrl(WSFunctions.mod_quiz_get_user_attempts) + `&quizid=${quizId}&userid=${userId}`)
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const jsonRes: { attempts: MoodleQuizAttemptType[] } = await response.json()
    return jsonRes.attempts
}


async function getQuizSubmissions() {
    const result: SubmissionType[] = []

    const courses = await getCourses()
    const allQuizzes = await getAllQuizzes()

    // list of quizzes that require manual grading
    const manualGradingQuizzes: MoodleQuizType[] = []
    for (let i = 0; i < allQuizzes.length; i++) {
        const quiz = allQuizzes[i];
        const quizQuestionTypes = await getQuizQuestionTypes(quiz.id)
        if (quizQuestionTypes.includes("essay")) {
            manualGradingQuizzes.push(quiz)
        }
    }

    for (let i = 0; i < manualGradingQuizzes.length; i++) {
        const quiz = manualGradingQuizzes[i];
        const enrolledUsers = await getEnrolledUsersByCourseModule(quiz.coursemodule)

        for (let j = 0; j < enrolledUsers.length; j++) {
            const enrolledUser = enrolledUsers[j];
            const userAttempts = await getUserQuizAttempts(quiz.id, enrolledUser.id)

            for (let k = 0; k < userAttempts.length; k++) {
                const attempt = userAttempts[k];

                if (attempt.state == "finished" && attempt.sumgrades == null) {

                    const courseName = courses.find((item) => item.id == quiz.course)?.name
                    result.push({
                        courseId: quiz.course,
                        courseName: courseName || 'course ID - ' + quiz.course.toString(),
                        coursModuleId: quiz.coursemodule,
                        submissionName: quiz.name,
                        id: attempt.id,
                        userId: attempt.userid,
                        attemptNumber: attempt.attempt,
                        submittedAt: attempt.timefinish * 1000,
                        status: attempt.state,
                        submissionType: "quiz",
                        gradingUrl: `https://moodle.shaper.co.za/mod/quiz/review.php?attempt=${attempt.id}`,
                        courseUrl: `https://moodle.shaper.co.za/course/view.php?id=${quiz.course}`,
                        moduleUrl: `https://moodle.shaper.co.za/mod/quiz/view.php?id=${quiz.coursemodule}`
                    })
                }
            }
        }
    }

    return result
}
export default { getCourses, getAssignmentSubmissions, getQuizSubmissions }