import { useState, useEffect } from "react";
import storageService from "../utils/storageService";

// Type definition for each log entry returned by Supabase

type LogRow = {
  id: number;
  created_at: string;
  submitted_at: string | null;
  course_id: number;
  assignment_id: number;
  user_id: number;
  assignment_name: string;
  submission_status: string;
  autograde_status: string;
  autograde_status_details: string;
};


// Utility: Extract unique dropdown options for filters

function uniqueOptions(field: keyof LogRow, rows: LogRow[]) {
  return Array.from(new Set(rows.map((row) => String(row[field]))));
}
// Utility: Convert timestamps into “x minutes/hours/days ago”

function timeAgo(dateString: string | null): string {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "—";

  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths} month${diffMonths === 1 ? "" : "s"} ago`;
}

// MAIN COMPONENT — Logs Table

export default function LogsTable() {
  // UI state
  const [filters, setFilters] = useState({
    course_id: "",
    assignment_name: "",
    autograde_status: "",
  });

  const [rows, setRows] = useState<LogRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 50;
  const [selectedError, setSelectedError] = useState<string | null>(null);

  
  // Load logs from Supabase

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
        assignment_id: item.assignment_id,
        user_id: item.user_id,
        assignment_name: item.assignment_name,
        submission_status: item.submission_status,
        autograde_status: item.autograde_status,
        autograde_status_details: item.autograde_status_details,
      }));

      // Sort: latest first
      mapped.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setRows(mapped);
    } catch (err) {
      console.error(err);
      setError("Failed to load logs");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadLogs();
  }, []);


  // Filtering logic
 
  const filteredData = rows.filter((row) => {
    const courseMatch = !filters.course_id || String(row.course_id) === filters.course_id;
    const assignmentMatch = !filters.assignment_name || row.assignment_name === filters.assignment_name;
    const statusMatch = !filters.autograde_status || row.autograde_status === filters.autograde_status;
    return courseMatch && assignmentMatch && statusMatch;
  });

  // Pagination logic

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const pageData = filteredData.slice(startIndex, startIndex + pageSize);

  const courseOptions = uniqueOptions("course_id", rows);
  const assignmentOptions = uniqueOptions("assignment_name", rows);
  const statusOptions = uniqueOptions("autograde_status", rows);

  
  // Refresh & Render
  return (
    <div className="p-4">
      {/* Refresh button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => loadLogs()}
          className="flex items-center gap-2 bg-[#1E2430] text-white px-4 py-2 rounded-lg shadow hover:bg-[#2A3242] transition"
        >
          Refresh
        </button>
      </div>

      {/* Filter dropdowns */}
      <div className="flex gap-4 mb-4">
        <select
          className="border p-2"
          value={filters.course_id}
          onChange={(e) => {
            setFilters((p) => ({ ...p, course_id: e.target.value }));
            setPage(1);
          }}
        >
          <option value="">All Courses</option>
          {courseOptions.map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>

        <select
          className="border p-2"
          value={filters.assignment_name}
          onChange={(e) => {
            setFilters((p) => ({ ...p, assignment_name: e.target.value }));
            setPage(1);
          }}
        >
          <option value="">All Assignments</option>
          {assignmentOptions.map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>

        <select
          className="border p-2"
          value={filters.autograde_status}
          onChange={(e) => {
            setFilters((p) => ({ ...p, autograde_status: e.target.value }));
            setPage(1);
          }}
        >
          <option value="">All Statuses</option>
          {statusOptions.map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
      </div>

      {/* LOGS TABLE */}
      <table className="w-full border-collapse table-fixed">
        <thead>
          <tr className="border-b bg-gray-100">
            <th className="p-2 text-left">Timestamp</th>
            <th className="p-2 text-left">Submitted</th>
            <th className="p-2 text-left">Course</th>
            <th className="p-2 text-left">Assignment</th>
            <th className="p-2 text-left">Learner</th>
            <th className="p-2 text-left">Submission Status</th>
            <th className="p-2 text-left">Autograde Status</th>
            <th className="p-2 text-left w-64">Details</th>
            <th className="p-2 text-left w-20">Action</th>
          </tr>
        </thead>

        <tbody>
          {/* Loading row */}
          {isLoading && (
            <tr>
              <td colSpan={9} className="text-center py-4">Loading logs...</td>
            </tr>
          )}

          {/* Error row */}
          {!isLoading && error && (
            <tr>
              <td colSpan={9} className="text-center py-4 text-red-500">{error}</td>
            </tr>
          )}

          {/* Data rows */}
          {!isLoading && !error && pageData.map((row) => {
              const moodleUrl = `https://moodle.shaper.co.za/mod/assign/view.php?id=${row.assignment_id}`;

              return (
                <tr key={row.id} className="border-b">
                  <td className="p-2">{new Date(row.created_at).toISOString().slice(0, 16).replace('T', ' ')}</td>
                  <td className="p-2">{timeAgo(row.submitted_at)}</td>
                  <td className="p-2">{row.course_id}</td>
                  <td className="p-2">{row.assignment_name}</td>
                  <td className="p-2">{row.user_id}</td>
                  <td className="p-2 capitalize">{row.submission_status}</td>
                  <td className="p-2 capitalize">{row.autograde_status}</td>

                  <td className="p-2 w-64 truncate">
                    <span className="truncate inline-block max-w-full">
                      {row.autograde_status_details.slice(0, 80)}...
                    </span>
                    <button
                      onClick={() => setSelectedError(row.autograde_status_details)}
                      className="ml-2 text-blue-600 hover:underline whitespace-nowrap"
                    >
                      View
                    </button>
                  </td>

                  <td className="p-2 w-20 whitespace-nowrap">
                    <a
                      href={moodleUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Open
                    </a>
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <button
          disabled={safePage === 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        >
          Previous
        </button>

        <span>Page {safePage} of {totalPages}</span>

        <button
          disabled={safePage === totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>

      {/* Error Details Modal */}
      {selectedError && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl p-4 rounded shadow">
            <h2 className="text-lg font-bold mb-2">Error Details</h2>
            <pre className="bg-gray-100 p-2 rounded max-h-80 overflow-auto text-sm whitespace-pre-wrap">
              {selectedError}
            </pre>
            <button
              onClick={() => setSelectedError(null)}
              className="mt-4 px-4 py-2 bg-gray-700 text-white rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
