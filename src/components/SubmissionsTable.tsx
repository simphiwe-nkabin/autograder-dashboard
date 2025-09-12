import { AgGridReact } from "ag-grid-react";
import { AgColumn, AllCommunityModule, ModuleRegistry, type ColDef } from "ag-grid-community";
import { useEffect, useState } from "react";
import type { CourseType, SubmissionType } from "../types/EntityTypes";
import moodleService from "../utils/moodleService";
import moment from "moment";
import Spinner from "./Spinner";
import Select from "./Select";
import { useSearchParams } from "react-router-dom";

ModuleRegistry.registerModules([AllCommunityModule]);

type RowItemType = {
    course: string,
    assignment: string,
    learner: number,
    status: string,
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
        {
            field: 'course',
            cellStyle: { color: "#0084d1", cursor: "pointer" }
        },
        { field: 'assignment', cellStyle: { color: "#0084d1", cursor: "pointer" } },
        { field: 'learner', width: 100, resizable: false, flex: 0 },
        { field: 'submitted', valueFormatter: (param) => moment(param.value).fromNow() },
        { field: 'status', width: 100, resizable: false, flex: 0 },
        { field: 'deadline', resizable: false },
        { field: 'action', width: 150, resizable: false, flex: 0, cellStyle: { color: "#0084d1", cursor: "pointer" }, sortable: false },
        { field: 'moduleId', hide: true },
        { field: 'courseId', hide: true },
        { field: 'learnerId', hide: true }
    ]);

    const defaultColDef = { flex: 1 };

    useEffect(() => {
        try {
            setLoading(true)
            moodleService.getSubmissions().then((data: SubmissionType[]) => {
                const submissions: RowItemType[] = data.filter(sub => sub.gradingStatus !== 'graded' && sub.status == 'submitted').map((submission) => ({
                    course: submission.courseName,
                    assignment: submission.assignmentName,
                    learner: submission.userId,
                    submitted: new Date(submission.submittedAt),
                    status: submission.status,
                    action: 'Grade',
                    moduleId: submission.coursModuleId,
                    courseId: submission.courseId,
                    learnerId: submission.userId
                }))
                setRowData(submissions)
                setLoading(false)
            })
        } catch (error) {
            setLoading(false)
        }

        // courses
        try {
            setCoursesLoading(true)
            moodleService.getCourses().then(data => setCourses(data))
        } catch (error) {
            console.log(error)
        } finally {
            setCoursesLoading(false)
        }
    }, [])

    return (
        <div>
            <form className="max-w-sm mb-5">
                <label className="mb-1 block">Select a Course</label>
                <Select name="course"
                    onSelect={(value) => setSearchParams((searchParams) => {
                        searchParams.set("course", value);
                        return searchParams;
                    })}
                    loading={coursesLoading}
                    options={courses ? [{ label: 'All courses', id: 0, value: 0 }, ...courses.map((c: CourseType) => ({ label: c.name, id: c.id, value: c.id }))] : []} />
            </form>
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
                    onCellClicked={(event) => {
                        const data = event.data
                        const column: AgColumn | any = event.column

                        if (column.colId == 'action')
                            window.open(`https://moodle.shaper.co.za/mod/assign/view.php?id=${data.moduleId}&action=grader&userid=${data.learnerId}`, "_blank");
                        if (column.colId == 'assignment')
                            window.open(`https://moodle.shaper.co.za/mod/assign/view.php?id=${data.moduleId}`, "_blank");
                        if (column.colId == 'course')
                            window.open(`https://moodle.shaper.co.za/course/view.php?id=${data.courseId}`, "_blank");
                    }}
                />}
            </div>
        </div>
    );
}
