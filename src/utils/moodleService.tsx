import type { ActivityReportType } from "../types/Reports";

const WSFunctions = {
    core_course_get_courses: "core_course_get_courses",
    mod_assign_get_assignments: "mod_assign_get_assignments",
    mod_assign_get_submissions: "mod_assign_get_submissions",
    core_enrol_get_enrolled_users: "core_enrol_get_enrolled_users",
    mod_quiz_get_quizzes_by_courses: "mod_quiz_get_quizzes_by_courses",
    mod_quiz_get_user_quiz_attempts: "mod_quiz_get_user_quiz_attempts",
    mod_quiz_get_quiz_required_qtypes: "mod_quiz_get_quiz_required_qtypes",
    core_course_get_enrolled_users_by_cmid: "core_course_get_enrolled_users_by_cmid",
    mod_quiz_get_user_attempts: "mod_quiz_get_user_attempts",
    local_grades_get_ungraded_submissions: "local_grades_get_ungraded_submissions",
    local_grades_get_activity_reports: "local_grades_get_activity_reports"
}

function getUrl(wsfunction: string) {
    return `${import.meta.env.VITE_MOODLE_BASEURL}?wstoken=${import.meta.env.VITE_MOODLE_WEB_TOKEN}&wsfunction=${wsfunction}&moodlewsrestformat=json`
}

export type UngradedSubmissionType = {
    id: string; // The a240 or q123 string
    coursename: string;
    activitytype: string;
    activityname: string;
    username: string;
    timemodified: number;
    coursepath: string;
    activitypath: string;
    gradepath: string;
}

async function getUngradedSubmissions(): Promise<UngradedSubmissionType[]> {
    let response;
    try {
        response = await fetch(getUrl(WSFunctions.local_grades_get_ungraded_submissions))
    } catch (error) {
        console.log(`Error: Could not fetch ungraded submissions`, error);
        return []
    }

    if (!response.ok) {
        console.log(`Error: Could not fetch ungraded submissions HTTP error`, response.status)
        return []
    }

    const result: UngradedSubmissionType[] = await response.json();
    if (!Array.isArray(result)) return [];
    
    return result;
}

async function getActivityReports(): Promise<ActivityReportType[]> {
    let response;
    try {
        response = await fetch(getUrl(WSFunctions.local_grades_get_activity_reports))
    } catch (error) {
        console.log(`Error: Could not fetch ungraded submissions`, error);
        return []
    }

    if (!response.ok) {
        console.log(`Error: Could not fetch ungraded submissions HTTP error`, response.status)
        return []
    }

    const result: ActivityReportType[] = await response.json();
    if (!Array.isArray(result)) return [];
    
    return result;
}

export default { getUngradedSubmissions, getActivityReports }