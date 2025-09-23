import { AgGridReact } from "ag-grid-react";
import { AgColumn, AllCommunityModule, ModuleRegistry, type CellClickedEvent, type CellEditingStoppedEvent, type ColDef } from "ag-grid-community";
import { useEffect, useState } from "react";
import type { CourseType } from "../types/EntityTypes";
import moodleService from "../utils/moodleService";
import moment from "moment";
import Spinner from "./Spinner";
import Select from "./Select";
import { useSearchParams } from "react-router-dom";
import storageService from "../utils/storageService";

ModuleRegistry.registerModules([AllCommunityModule]);

type RowItemType = {
    submissionId: number
    course: string,
    assignment: string,
    learner: number,
    status: string,
    blocked: boolean,
    comment: string,
    action: string,
    moduleId: number,
    courseId: number,
    learnerId: number
}

export default function SubmissionTable() {
    const [rowData, setRowData] = useState<RowItemType[]>([])
    const [loading, setLoading] = useState<Boolean>(false)

    const [searchParams, setSearchParams] = useSearchParams()

    // Courses data, loading, error
    const [courses, setCourses] = useState<CourseType[]>([])
    const [coursesLoading, setCoursesLoading] = useState<boolean>(false)


    const [colDefs] = useState<ColDef[]>([
        { field: 'submissionId', hide: true },
        {
            field: 'course',
            cellStyle: { color: "#0084d1", cursor: "pointer" }
        },
        { field: 'assignment', cellStyle: { color: "#0084d1", cursor: "pointer" }, flex: 1 },
        { field: 'learner', width: 100, resizable: false, flex: 0 },
        { field: 'submitted', width: 200, resizable: false, flex: 0, valueFormatter: (param) => moment(param.value).fromNow() },
        { field: 'status', width: 100, resizable: false, flex: 0 },
        { field: 'blocked', width: 100, resizable: false, flex: 0, editable: true },
        { field: "comment", editable: (params) => params.data.blocked, cellStyle: { color: "red" } },
        { field: 'action', width: 150, resizable: false, flex: 0, cellStyle: { color: "#0084d1", cursor: "pointer" }, sortable: false },
        { field: 'moduleId', hide: true },
        { field: 'courseId', hide: true },
        { field: 'learnerId', hide: true }
    ]);

    const defaultColDef = { flex: 1 };

    async function fetchData() {
        // submissions
        setLoading(true)
        try {
            const submissions = await moodleService.getSubmissions()
            const blockedSubmissions = await storageService.getAllBlockedSubmissions()
            const submissionRows: RowItemType[] = submissions.filter(sub => sub.gradingStatus !== 'graded' && sub.status == 'submitted').map((submission) => {
                const blockedSubmission = blockedSubmissions.find((item => item.submission_id == submission.id))
                return {
                    submissionId: submission.id,
                    course: submission.courseName,
                    assignment: submission.assignmentName,
                    learner: submission.userId,
                    submitted: new Date(submission.submittedAt),
                    status: submission.status,
                    blocked: !!blockedSubmission?.id,
                    comment: blockedSubmission?.comment || "",
                    action: 'Grade',
                    moduleId: submission.coursModuleId,
                    courseId: submission.courseId,
                    learnerId: submission.userId
                }
            })
            setRowData(submissionRows)
            setLoading(false)
        } catch (error) {
            console.log(error);
            setLoading(false)
        }
    }

    useEffect(() => {
        // courses
        setCoursesLoading(true)
        moodleService.getCourses()
            .then(data => {
                setCourses(data)
                setCoursesLoading(false)
            })
            .catch(err => {
                console.log(err);
                setCoursesLoading(false)
            })
        fetchData()
    }, [])

    return (
        <div>
            <div className="flex justify-between items-center">
                <div className="max-w-sm mb-5">
                    <p className="mb-1 block">Select a Course</p>
                    <Select name="course"
                        onSelect={(value) => setSearchParams((searchParams) => {
                            searchParams.set("course", value);
                            return searchParams;
                        })}
                        loading={coursesLoading}
                        options={courses ? [{ label: 'All courses', id: 0, value: 0 }, ...courses.map((c: CourseType) => ({ label: c.name, id: c.id, value: c.id }))] : []} />
                </div>
                <button disabled={!!loading} onClick={() => fetchData()} title="refresh submission data" className="border-2 border-gray-100 bg-gray-800 py-1 px-3 rounded-lg text-white flex items-center gap-2 hover:bg-gray-700 active:border-blue-400 disabled:opacity-50 disabled:border-none">
                    Refresh
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-arrow-clockwise" viewBox="0 0 16 16">
                        <path fill-rule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2z" />
                        <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466" />
                    </svg>
                </button>
            </div>

            <div style={{ width: "100%", height: 500 }}>
                {loading &&
                    <div className="text-center">
                        <Spinner />
                        <p>fetching submissions</p>
                    </div>
                }
                {!loading && <AgGridReact
                    rowData={rowData.filter(item => (!parseInt(searchParams.get('course') || '') ? true : item.courseId == parseInt(searchParams.get('course') || '')))}
                    columnDefs={colDefs}
                    defaultColDef={defaultColDef}
                    onCellClicked={(event: CellClickedEvent) => {
                        const data = event.data
                        const column: AgColumn | any = event.column

                        if (column.colId == 'action')
                            window.open(`https://moodle.shaper.co.za/mod/assign/view.php?id=${data.moduleId}&action=grader&userid=${data.learnerId}`, "_blank");
                        if (column.colId == 'assignment')
                            window.open(`https://moodle.shaper.co.za/mod/assign/view.php?id=${data.moduleId}`, "_blank");
                        if (column.colId == 'course')
                            window.open(`https://moodle.shaper.co.za/course/view.php?id=${data.courseId}`, "_blank");
                    }}
                    onCellEditingStopped={(event: CellEditingStoppedEvent) => {
                        const column: AgColumn | any = event.column

                        if (column.colId == 'blocked') {
                            if (event.oldValue === false)
                                storageService
                                    .createBlockedSubmission(event.data.submissionId)
                                    .catch(err => { console.log(err) })
                            else
                                storageService
                                    .removeBlockedSubmission(event.data.submissionId)
                                    .catch(err => { console.log(err) })
                        }

                        if (column.colId == 'comment')
                            storageService
                                .updateBlockedSubmissionComment(event.data.submissionId, event.newValue)
                                .catch(err => { console.log(err) })
                    }}
                />}
            </div>
        </div>
    );
}
