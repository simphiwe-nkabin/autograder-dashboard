import { useState, useEffect } from "react";
import moment from "moment";
import storageService from "../utils/storageService";

// Log row type
type LogRow = {
  id: number;
  createdAt: string;
  submittedAt: Date | string | null;
  userId: number;
  assignment: string;
  status: string;
  details: string;
  attempts: number;
  submisionUrl: string;
};

// Unique filter options
function uniqueOptions(field: keyof LogRow, rows: LogRow[]) {
  return Array.from(new Set(rows.map((row) => String(row[field]))));
}

// Time ago using moment.js
function timeAgo(dateString: string | null | Date): string {
  if (!dateString) return "—";
  return moment(dateString).fromNow();
}

export default function LogsTable() {
  // UI state
  const [filters, setFilters] = useState({
    assignment: "",
    status: "",
  });

  const [rows, setRows] = useState<LogRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [selectedError, setSelectedError] = useState<string | null>(null);

  const pageSize = 50;

  // Load logs from Supabase
  async function loadLogs() {
    try {
      setIsLoading(true);
      setError(null);

      const data = await storageService.getAutogradeWorkerLogs();
      console.log(data);
      

      const mapped: LogRow[] = data.map((item) => ({
        id: item.id,
        createdAt: item.created_at,
        submittedAt: item?.data?.timecreated ? new Date(Number(item?.data?.timecreated) * 1000) : item.submitted_at,
        userId: item?.data?.userid || item.user_id,
        assignment: item?.data?.assignmentname || item.assignment_name,
        status: item.status || item.autograde_status,
        details: item.details || item.autograde_status_details,
        attempts: item.attempt,
        submisionUrl: `https://moodle.shaper.co.za/mod/assign/view.php?id=${item?.data?.cmid || item.cmid}&action=grader&userid=${item?.data?.userid || item.user_id}`
      }));

      mapped.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
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

  // Filtering
  const filteredData = rows.filter((row) => {
    const a =
      !filters.assignment || row.assignment === filters.assignment;
    const s =
      !filters.status || row.status === filters.status;
    return a && s;
  });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const pageData = filteredData.slice(startIndex, startIndex + pageSize);

  const assignmentOptions = uniqueOptions("assignment", rows);
  const statusOptions = uniqueOptions("status", rows);

  return (
    <div className="p-4">
      {/* Refresh */}
      <div className="flex justify-end mb-4">
        <button
          onClick={loadLogs}
          className="flex items-center gap-2 bg-[#1E2430] text-white px-4 py-2 rounded-lg shadow hover:bg-[#2A3242]"
        >
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-4">
        <select
          className="border p-2"
          value={filters.assignment}
          onChange={(e) => {
            setFilters((p) => ({ ...p, assignment: e.target.value }));
            setPage(1);
          }}
        >
          <option value="">All Assignments</option>
          {assignmentOptions.map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>

        <select
          className="border p-2"
          value={filters.status}
          onChange={(e) => {
            setFilters((p) => ({ ...p, status: e.target.value }));
            setPage(1);
          }}
        >
          <option value="">All Statuses</option>
          {statusOptions.map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
      </div>

      {/* TABLE */}
      <table className="w-full table-fixed border-collapse">
        <thead>
          <tr className="border-b bg-gray-100">
            <th className="p-2 text-left">Timestamp</th>
            <th className="p-2 text-left">Submitted</th>
            <th className="p-2 text-left">Assignment</th>
            <th className="p-2 text-left">Learner</th>
            <th className="p-2 text-left">Status</th>
            <th className="p-2 w-25 text-left">Attempts</th>
            <th className="p-2 w-64 text-left">Details</th>
            <th className="p-2 w-42 text-left">Action</th>
          </tr>
        </thead>

        <tbody>
          {isLoading && (
            <tr>
              <td colSpan={9} className="text-center py-4">
                Loading logs...
              </td>
            </tr>
          )}

          {!isLoading && error && (
            <tr>
              <td colSpan={9} className="text-center py-4 text-red-500">
                {error}
              </td>
            </tr>
          )}

          {!isLoading &&
            !error &&
            pageData.map((row) => {
              const viewUrl = row.submisionUrl;

              return (
                <tr key={row.id} className="border-b">
                  <td className="p-2">
                    {moment(row.createdAt).format("YYYY-MM-DD HH:mm")}
                  </td>
                  <td className="p-2">{timeAgo(row.submittedAt)}</td>
                  <td title={row.assignment} className="p-2 overflow-hidden whitespace-nowrap text-ellipsis">{row.assignment}</td>
                  <td className="p-2">{row.userId}</td>
                  <td className="p-2 capitalize">{row.status}</td>
                  <td className="p-2 capitalize">{row.attempts}</td>

                  {/* Details (2-line clamp) */}
                  <td className="p-2 w-64" title={row.details}>
                    <button
                      onClick={() => setSelectedError(row.details)}
                      className="text-left w-full text-blue-600 hover:underline whitespace-nowrap overflow-hidden text-ellipsis"
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {row.details}
                    </button>
                  </td>

                  {/* View Submission */}
                  <td className="p-2">
                    <a
                      href={viewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      View Submission
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

        <span>
          Page {safePage} of {totalPages}
        </span>

        <button
          disabled={safePage === totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>

      {/* Modal */}
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
