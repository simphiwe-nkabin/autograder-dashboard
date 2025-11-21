import { AgGridReact } from "ag-grid-react";
import { AgColumn, AllCommunityModule, ModuleRegistry, type CellClickedEvent, type CellEditingStoppedEvent, type ColDef } from "ag-grid-community";
import { useEffect, useMemo, useState } from "react";
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

    // State for filters
    const [courseFilter, setCourseFilter] = useState<string>('all');
    const [blockedFilter, setBlockedFilter] = useState<string>('all'); // 'all', 'blocked', 'unblocked'
    const [commentFilter, setCommentFilter] = useState<string>('all'); // 'all', 'with', 'without'

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
        { field: "comment", editable: true, cellStyle: { color: "red" } },
        { field: 'action', width: 150, resizable: false, flex: 0, cellStyle: { color: "#0084d1", cursor: "pointer" }, sortable: false },
        { field: 'courseUrl', hide: true },
        { field: 'moduleUrl', hide: true },
        { field: 'gradingUrl', hide: true },

    ]);

    const defaultColDef = { flex: 1 };

    async function fetchData() {
        setLoading(true);
        try {
            // 1. Fetch all Moodle submissions and add the 'type' property
            const moodleAssignments = (await moodleService.getAssignmentSubmissions()).map(s => ({ ...s, type: 'assignment' }));
            const moodleQuizzes = (await moodleService.getQuizSubmissions()).map(s => ({ ...s, type: 'quiz' }));
            const allMoodleSubmissions = [...moodleAssignments, ...moodleQuizzes];

            // 2. Fetch all submission metadata (blocked status, comments) from our DB in one call
            const localSubmissions = await storageService.getAllSubmissions();

            // 3. Create a lookup map for efficient access to local data
            const localSubmissionsMap = new Map(localSubmissions.map(s => [s.submission_id, s]));

            // 4. Map Moodle data to rows, enriching with local data
            const submissionRows: RowItemType[] = allMoodleSubmissions.map((submission) => {
                const localData = localSubmissionsMap.get(submission.id);
                return {
                    submissionId: submission.id,
                    course: submission.courseName,
                    assignment: submission.submissionName,
                    learner: submission.userId,
                    submitted: new Date(submission.submittedAt),
                    status: submission.status,
                    blocked: localData?.blocked || false,
                    comment: localData?.comment || "",
                    action: 'Grade',
                    type: submission.type as 'assignment' | 'quiz',
                    courseUrl: submission.courseUrl,
                    moduleUrl: submission.moduleUrl,
                    gradingUrl: submission.gradingUrl,
                };
            });

            setRowData(submissionRows);
        } catch (error) {
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchData();
    }, []);

    const courses = useMemo(() => {
        const courseSet = new Set(rowData.map(row => row.course));
        return ['all', ...Array.from(courseSet)];
    }, [rowData]);

    const filteredData = useMemo(() => {
        return rowData.filter(row => {
            const courseMatch = courseFilter === 'all' || row.course === courseFilter;

            const blockedMatch = blockedFilter === 'all' ||
                (blockedFilter === 'blocked' && row.blocked) ||
                (blockedFilter === 'unblocked' && !row.blocked);

            const commentMatch = commentFilter === 'all' ||
                (commentFilter === 'with' && row.comment && row.comment.trim() !== "") ||
                (commentFilter === 'without' && (!row.comment || row.comment.trim() === ""));

            return courseMatch && blockedMatch && commentMatch;
        });
    }, [rowData, courseFilter, blockedFilter, commentFilter]);

    return (
        <div>
            <div className="flex justify-between items-center mb-3">
                <div className="flex gap-4 items-center">
                    {/* Course Filter */}
                    <div>
                        <label htmlFor="course-filter" className="mr-2 text-white">Filter By</label>
                        <select
                            id="course-filter"
                            value={courseFilter}
                            onChange={(e) => setCourseFilter(e.target.value)}
                            className="border-2 border-gray-100 bg-gray-800 py-1 px-3 rounded-lg text-white"
                        >
                            {courses.map(course => (
                                <option key={course} value={course}>{course === 'all' ? 'All Courses' : course}</option>
                            ))}
                        </select>
                    </div>

                    {/* Blocked Filter */}
                    <div>
                       
                        <select
                            id="blocked-filter"
                            value={blockedFilter}
                            onChange={(e) => setBlockedFilter(e.target.value)}
                            className="border-2 border-gray-100 bg-gray-800 py-1 px-3 rounded-lg text-white"
                        >
                            <option value="all">All</option>
                            <option value="blocked">Blocked</option>
                            <option value="unblocked">Unblocked</option>
                        </select>
                    </div>

                    {/* Comment Filter */}
                    <div>
                       <select
                            id="comment-filter"
                            value={commentFilter}
                            onChange={(e) => setCommentFilter(e.target.value)}
                            className="border-2 border-gray-100 bg-gray-800 py-1 px-3 rounded-lg text-white"
                        >
                            <option value="all">All</option>
                            <option value="with">With Comment</option>
                            <option value="without">Without Comment</option>
                        </select>
                    </div>
                </div>

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
                    rowData={filteredData}
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
                        const { colDef, data, newValue, oldValue } = event;
                        const submissionId = data.submissionId;

                        switch (colDef.field) {
                            case 'blocked':
                                // The grid has already updated the value in the row data, so `newValue` is the new state
                                storageService.toggleBlockedStatus(submissionId, oldValue)
                                    .catch(() => { /* Error is intentionally ignored */ });
                                break;

                            case 'comment':
                                storageService.saveSubmissionComment(submissionId, newValue)
                                    .catch(() => { /* Error is intentionally ignored */ });
                                break;
                        }
                    }}
                />}
            </div>
        </div>
    );
}
