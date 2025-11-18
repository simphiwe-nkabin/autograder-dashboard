import { useState, useEffect } from "react";
import storageService from '../utils/storageService';



type LogRow = {
  id: number;
  created_at: string;               // Timestamp
  submitted_at: string | null;      // Submission date
  course_id: number;
  assignment_name: string;
  submission_status: string;
  autograde_status: string;
  autograde_status_details: string;
};


function uniqueOptions(field: keyof LogRow, rows: LogRow[]) {
  return Array.from(new Set(rows.map((row) => String(row[field]))));
}

export default function LogsTable() {
  const [filters, setFilters] = useState({
    course_id: '',
    assignment_name: '',
    autograde_status: '',
  });

  const [rows, setRows] = useState<LogRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadLogs() {
      try {
        setIsLoading(true);
        setError(null);

        const data = await storageService.getAutogradeWorkerLogs();

        const mapped: LogRow[] = data.map((item) => ({
          id: item.id,
          created_at: item.created_at,
          submitted_at: item.submitted_at,
          course_id: item.course_id,
          assignment_name: item.assignment_name,
          submission_status: item.submission_status,
          autograde_status: item.autograde_status,
          autograde_status_details: item.autograde_status_details,
        }));

        setRows(mapped);
      } catch (err) {
        console.error(err);
        setError('Failed to load logs');
      } finally {
        setIsLoading(false);
      }
    }

    loadLogs();
  }, []);

  const filteredData = rows.filter((row) => {
    const courseMatches =
      !filters.course_id || String(row.course_id) === filters.course_id;

    const assignmentMatches =
      !filters.assignment_name ||
      row.assignment_name === filters.assignment_name;

    const statusMatches =
      !filters.autograde_status ||
      row.autograde_status === filters.autograde_status;

    return courseMatches && assignmentMatches && statusMatches;
  });

  const courseOptions = uniqueOptions('course_id', rows);
  const assignmentOptions = uniqueOptions('assignment_name', rows);
  const statusOptions = uniqueOptions('autograde_status', rows);

  return (
    <div className="p-4">
      {/* Filters */}
      <div className="flex gap-4 mb-4">
        {/* Course ID */}
        <select
          className="border p-2"
          value={filters.course_id}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, course_id: e.target.value }))
          }
        >
          <option value="">All Courses</option>
          {courseOptions.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>

        {/* Assignment Name */}
        <select
          className="border p-2"
          value={filters.assignment_name}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, assignment_name: e.target.value }))
          }
        >
          <option value="">All Assignments</option>
          {assignmentOptions.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>

        {/* Autograde Status */}
        <select
          className="border p-2"
          value={filters.autograde_status}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              autograde_status: e.target.value
            }))
          }
        >
          <option value="">All Statuses</option>
          {statusOptions.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b bg-gray-100">
            <th className="p-2 text-left">Timestamp</th>
            <th className="p-2 text-left">Submitted At</th>
            <th className="p-2 text-left">Course ID</th>
            <th className="p-2 text-left">Assignment</th>
            <th className="p-2 text-left">Submission Status</th>
            <th className="p-2 text-left">Autograde Status</th>
            <th className="p-2 text-left">Details</th>
          </tr>
        </thead>

        <tbody>
          {isLoading && (
            <tr>
              <td colSpan={7} className="text-center py-4">
                Loading logs...
              </td>
            </tr>
          )}

          {!isLoading && error && (
            <tr>
              <td colSpan={7} className="text-center py-4 text-red-600">
                {error}
              </td>
            </tr>
          )}

          {!isLoading &&
            !error &&
            filteredData.map((row) => (
              <tr key={row.id} className="border-b">
                <td className="p-2">{row.created_at}</td>
                <td className="p-2">{row.submitted_at || '—'}</td>
                <td className="p-2">{row.course_id}</td>
                <td className="p-2">{row.assignment_name}</td>
                <td className="p-2 capitalize">{row.submission_status}</td>
                <td className="p-2 capitalize">{row.autograde_status}</td>
                <td className="p-2">{row.autograde_status_details}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

