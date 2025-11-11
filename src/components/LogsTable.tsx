import { useState } from "react";

type LogRow = {
  timestamp: string;
  course: string;
  assignment: string;
  learner: string;
  status: string;
  error: string;
  output: string;
};

//mock data
const LogData: LogRow[] = [
  {
    timestamp: "2025-10-28 10:15:23",
    course: "Python",
    assignment: "Python Basics",
    learner: "John",
    status: "Graded",
    error: "",
    output: "Passed all tests",
  },
  {
    timestamp: "2025-10-28 10:45:11",
    course: "JavaScript",
    assignment: "JavaScript Basics",
    learner: "Teekay",
    status: "Error",
    error: "Compilation failed",
    output: "",
  },
];

function uniqueOptions(field: keyof LogRow) {
  return Array.from(new Set(LogData.map((row) => row[field]))) as string[];
}

export default function LogsTable() {
  const [filters, setFilters] = useState({ course: "", assignment: "", status: "" });

  const filteredData = LogData.filter(
    (row) =>
      (!filters.course || row.course === filters.course) &&
      (!filters.assignment || row.assignment === filters.assignment) &&
      (!filters.status || row.status === filters.status)
  );

  return (
    <div>
      {/* Filters */}
      <div className="mb-4 flex gap-4">
        <select
          className="border rounded px-2 py-1"
          value={filters.course}
          onChange={(e) => setFilters({ ...filters, course: e.target.value })}
        >
          <option value="">All Courses</option>
          {uniqueOptions("course").map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          className="border rounded px-2 py-1"
          value={filters.assignment}
          onChange={(e) => setFilters({ ...filters, assignment: e.target.value })}
        >
          <option value="">All Assignments</option>
          {uniqueOptions("assignment").map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <select
          className="border rounded px-2 py-1"
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="">All Statuses</option>
          {uniqueOptions("status").map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full table-fixed border border-gray-200">
          <thead>
            <tr>
              <th className="px-4 py-2 border-b font-semibold text-left">Timestamp</th>
              <th className="px-4 py-2 border-b font-semibold text-left">Course</th>
              <th className="px-4 py-2 border-b font-semibold text-left">Assignment</th>
              <th className="px-4 py-2 border-b font-semibold text-left">Learner</th>
              <th className="px-4 py-2 border-b font-semibold text-left">Status</th>
              <th className="px-4 py-2 border-b font-semibold text-left">Error</th>
              <th className="px-4 py-2 border-b font-semibold text-left">Autograder Output</th>
              <th className="px-4 py-2 border-b font-semibold text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length ? (
              filteredData.map((log, idx) => (
                <tr key={idx} className="border-t">
                  <td className="px-4 py-2">{log.timestamp}</td>
                  <td className="px-4 py-2">{log.course}</td>
                  <td className="px-4 py-2">{log.assignment}</td>
                  <td className="px-4 py-2">{log.learner}</td>
                  <td className="px-4 py-2">{log.status}</td>
                  <td className="px-4 py-2 text-red-600">{log.error}</td>
                  <td className="px-4 py-2">{log.output}</td>
                  <td className="px-4 py-2">
                    <button className="text-blue-500 underline">View</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="px-4 py-4 text-center">
                  No logs to show
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

