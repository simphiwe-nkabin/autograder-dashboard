import { AgGridReact } from "ag-grid-react";
import { AgColumn, AllCommunityModule, ModuleRegistry, type CellClickedEvent, type CellEditingStoppedEvent, type ColDef } from "ag-grid-community";
import { useEffect, useState } from "react";
import moodleService from "../utils/moodleService";
import moment from "moment";
import Spinner from "./Spinner";
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
    type: 'quiz' | 'assignment'
    courseUrl: string,
    moduleUrl: string,
    gradingUrl: string
}

export default function SubmissionTable() {
    const [rowData, setRowData] = useState<RowItemType[]>([])
    const [loading, setLoading] = useState<Boolean>(false)

    const [colDefs] = useState<ColDef[]>([
        { field: 'submissionId', hide: true },
        {
            field: 'course',
            filter: "agTextColumnFilter",
            cellStyle: { color: "#0084d1", cursor: "pointer" }
        },
        { field: 'assignment', cellStyle: { color: "#0084d1", cursor: "pointer" }, flex: 1 },
        { field: 'type', width: 150, resizable: false, flex: 0, filter: "agTextColumnFilter", },
        { field: 'learner', width: 100, resizable: false, flex: 0 },
        { field: 'submitted', width: 200, resizable: false, flex: 0, valueFormatter: (param) => moment(param.value).fromNow() },
        { field: 'status', width: 100, resizable: false, flex: 0 },
        { field: 'blocked', width: 100, resizable: false, flex: 0, editable: true },
        { field: "comment", editable: (params) => params.data.blocked, cellStyle: { color: "red" } },
        { field: 'action', width: 150, resizable: false, flex: 0, cellStyle: { color: "#0084d1", cursor: "pointer" }, sortable: false },
        { field: 'courseUrl', hide: true },
        { field: 'moduleUrl', hide: true },
        { field: 'gradingUrl', hide: true },

    ]);

    const defaultColDef = { flex: 1 };

    async function fetchData() {
        // submissions
        setLoading(true)
        try {
            const submissions = await moodleService.getAssignmentSubmissions()
            const blockedSubmissions = await storageService.getAllBlockedSubmissions()
            const submissionRows: RowItemType[] = submissions.map((submission) => {
                const blockedSubmission = blockedSubmissions.find((item => item.submission_id == submission.id))
                return {
                    submissionId: submission.id,
                    course: submission.courseName,
                    assignment: submission.submissionName,
                    learner: submission.userId,
                    submitted: new Date(submission.submittedAt),
                    status: submission.status,
                    blocked: !!blockedSubmission?.id,
                    comment: blockedSubmission?.comment || "",
                    action: 'Grade',
                    type: 'assignment',
                    courseUrl: submission.courseUrl,
                    moduleUrl: submission.moduleUrl,
                    gradingUrl: submission.gradingUrl
                }
            })
            setRowData(prevState => [...prevState, ...submissionRows])
            setLoading(false)
        } catch (error) {
            console.log(error);
            setLoading(false)
        }
    }

    useEffect(() => {
        moodleService.getQuizSubmissions().then(data => {
            const quizSubmissions: RowItemType[] = data.map(quiz => ({
                submissionId: quiz.id,
                course: quiz.courseName,
                assignment: quiz.submissionName,
                learner: quiz.userId,
                submitted: new Date(quiz.submittedAt),
                status: quiz.status,
                blocked: false,
                comment: "",
                action: 'Grade',
                type: 'quiz',
                courseUrl: quiz.courseUrl,
                moduleUrl: quiz.moduleUrl,
                gradingUrl: quiz.gradingUrl
            }))
            setRowData((prevState) => [...prevState, ...quizSubmissions])
        })
        fetchData()
    }, [])

    return (
        <div>
            <div className="flex justify-end items-center mb-3">
                <button disabled={!!loading} onClick={() => fetchData()} title="refresh submission data" className="border-2 border-gray-100 bg-gray-800 py-1 px-3 rounded-lg text-white flex items-center gap-2 hover:bg-gray-700 active:border-blue-400 disabled:opacity-50 disabled:border-none">
                    Refresh
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-arrow-clockwise" viewBox="0 0 16 16">
                        <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2z" />
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
                    rowData={rowData}
                    columnDefs={colDefs}
                    defaultColDef={defaultColDef}
                    onCellClicked={(event: CellClickedEvent) => {
                        const data: RowItemType = event.data
                        const column: AgColumn | any = event.column

                        if (column.colId == 'action')
                            window.open(data.gradingUrl, "_blank");
                        if (column.colId == 'assignment')
                            window.open(data.moduleUrl, "_blank");
                        if (column.colId == 'course')
                            window.open(data.courseUrl, "_blank");
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
