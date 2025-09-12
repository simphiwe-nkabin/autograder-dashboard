type MoodleCourseType = {
    id: number,
    shortname: string,
    categoryid: number,
    categorysortorder: number,
    fullname: string,
    displayname: string,
    idnumber: string,
    summary: string,
    summaryformat: number,
    format: string,
    showgrades: number,
    newsitems: number,
    startdate: number,
    enddate: number,
    numsections: number,
    maxbytes: number,
    showreports: number,
    visible: number,
    groupmode: number,
    groupmodeforce: number,
    defaultgroupingid: number,
    timecreated: number,
    timemodified: number,
    enablecompletion: number,
    completionnotify: number,
    lang: string,
    forcetheme: string,
    courseformatoptions: {
        name: string,
        value: number
    }[],
    showactivitydates: false,
    showcompletionconditions: null
}

type MoodleAssignmentType = {
    courses: {
        id: number,
        fullname: string
        shortname: string,
        timemodified: number,
        assignments: {
            id: number,
            cmid: number,
            course: number,
            name: string,
            nosubmissions: number,
            submissiondrafts: number,
            sendnotifications: number,
            sendlatenotifications: number,
            sendstudentnotifications: number,
            duedate: number,
            allowsubmissionsfromdate: number,
            grade: number,
            gradepenalty: number,
            timemodified: number,
            completionsubmit: number,
            cutoffdate: number,
            gradingduedate: number,
            teamsubmission: number,
            requireallteammemberssubmit: number,
            teamsubmissiongroupingid: number,
            blindmarking: number,
            hidegrader: number,
            revealidentities: number,
            attemptreopenmethod: string,
            maxattempts: number,
            markingworkflow: number,
            markingallocation: number,
            markinganonymous: number,
            requiresubmissionstatement: number,
            preventsubmissionnotingroup: number,
            configs: {
                plugin: string,
                subtype: string,
                name: string,
                value: string
            }[],
            intro: string,
            introformat: number,
            introfiles: [],
            introattachments: [],
            activity: string,
            activityformat: number,
            activityattachments: [],
            timelimit: number,
            submissionattachments: number
        }[]
    }[]
}

type MoodleSubmissionType = {
    assignments: [
        {
            assignmentid: number,
            submissions: {
                id: number,
                userid: number,
                attemptnumber: number,
                timecreated: number,
                timemodified: number,
                timestarted: null,
                status: string,
                groupid: number,
                plugins: {
                    type: string,
                    name: string,
                    fileareas: {
                        area: string,
                        files: []
                    }[],
                    editorfields: {
                        name: string,
                        description: string,
                        text: string,
                        format: number
                    }[]
                }[],
                gradingstatus: string
            }[]
        }
    ]
}

export type { MoodleCourseType, MoodleAssignmentType, MoodleSubmissionType }