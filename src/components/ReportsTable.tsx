import { useState, useEffect, useMemo } from 'react';
import ModalLearnerDetails from './ModalLearnerDetails';
import { getComplianceData } from '../utils/storageService'; // Function to fetch data from Supabase
import type { Learner } from '../types/Reports'; // Your existing Learner interface

// ─── Raw Data Type (from Moodle plugin → Supabase) ───────────────────

interface MoodleRawRecord {
  groupname: string;        
  userid: string;           
  firstname: string;
  lastname: string;
  activityname: string;     // Quiz/assignment title
  grade: string;            
  duedate: string;          // Unix timestamp as string
  submissiondate: string;   // Unix timestamp as string
}

// ─── Helper: Safely Parse Unix Timestamps ─────────────────────────────
// Converts string/number timestamps to JS number or null.
// Handles common invalid values: "", "0", "null", undefined.
const parseTimestamp = (value: string | number | null | undefined): number | null => {
  if (value == null || value === '' || value === '0' || value === 'null') return null;
  const num = typeof value === 'string' ? parseInt(value, 10) : value;
  return isNaN(num) ? null : num;
};

// ─── Main Component ───────────────────────────────────────────────────
const ReportsTable = () => {

  const [moodleData, setMoodleData] = useState<MoodleRawRecord[]>([]);

  // State: which cohort is selected in dropdown
  const [selectedCohortId, setSelectedCohortId] = useState<string>('');

  // State: modal visibility & selected learner
  const [showLearnerModal, setShowLearnerModal] = useState<boolean>(false);
  const [selectedLearner, setSelectedLearner] = useState<Learner | null>(null);

  // ─── EFFECT: Fetch Compliance Data on Mount ─────────────────────────
  // Calls storageService.getComplianceData() → fetches from /submissions
  
  useEffect(() => {
    getComplianceData()
      .then(data => {
        // Validate each record has required fields before using
        const validData: MoodleRawRecord[] = data.filter((item: any): item is MoodleRawRecord =>
          typeof item.groupname === 'string' &&
          typeof item.userid === 'string' &&
          typeof item.firstname === 'string' &&
          typeof item.lastname === 'string' &&
          typeof item.activityname === 'string' &&
          typeof item.grade === 'string' &&
          typeof item.duedate === 'string' &&
          typeof item.submissiondate === 'string'
        );
        setMoodleData(validData);
        console.log(' Loaded', validData.length, 'valid compliance records');
      })
      .catch(err => {
        console.error('Failed to load compliance data:', err);
        setMoodleData([]);
      });
  }, []);

  // ─── MEMO: Extract Unique Cohorts ───────────────────────────────────
  // Builds list of { id, name } for dropdown from `groupname` field.
  const cohorts = useMemo<{ id: string; name: string }[]>(() => {
    const uniqueGroupnames = [...new Set(moodleData.map(item => item.groupname))];
    return uniqueGroupnames.map(name => ({ id: name, name }));
  }, [moodleData]);

  // ─── MEMO: Transform Raw Data → Structured Learners ─────────────────
  // For selected cohort:
  // 1. Collect all records
  // 2. Get list of all deliverables (quizzes)
  // 3. Group by learner
  // 4. For each learner, compute status per deliverable + summary stats
  const { selectedCohort, learners } = useMemo<{
    selectedCohort: { id: string; name: string } | null;
    learners: Learner[];
  }>(() => {
    // If no cohort selected, return empty
    if (!selectedCohortId) {
      return { selectedCohort: null, learners: [] };
    }

    // Filter records for selected cohort
    const cohortItems = moodleData.filter(item => item.groupname === selectedCohortId);
    if (cohortItems.length === 0) {
      return {
        selectedCohort: { id: selectedCohortId, name: selectedCohortId },
        learners: [],
      };
    }

    // Get all unique deliverables (quiz titles) in this cohort
    const deliverableTitles = [...new Set(cohortItems.map(item => item.activityname))].sort();

    // Group records by learner (userid + name)
    const learnerMap = new Map<string, Omit<Learner, 'deliverables' | 'stats'>>();
    cohortItems.forEach(item => {
      const key = `${item.userid}|${item.firstname}|${item.lastname}`;
      if (!learnerMap.has(key)) {
        learnerMap.set(key, {
          id: item.userid,
          name: `${item.firstname} ${item.lastname}`,
          cohort: item.groupname,
        });
      }
    });

    // Build full learner objects with deliverables & stats
    const learners: Learner[] = Array.from(learnerMap.entries()).map(([key, base]) => {
      const rawRecords = cohortItems.filter(
        item => `${item.userid}|${item.firstname}|${item.lastname}` === key
      );

      // Initialize deliverables array and stats counters
      const deliverables: { title: string; status: "On time" | "Late" | "Missed" | "Pending"; score: number | undefined; submittedDate: string; lateDays: number; }[] = [];
      let done = 0, late = 0, missed = 0, strikes = 0;

      // Process each expected deliverable
      deliverableTitles.forEach(title => {
        const record = rawRecords.find(r => r.activityname === title);
        const duedate = parseTimestamp(record?.duedate);
        const submissiondate = parseTimestamp(record?.submissiondate);

        // Default state
        let status: 'On time' | 'Late' | 'Missed' | 'Pending' = 'Pending';
        let submittedDateStr = '—';
        let lateDays = 0;

        // Logic to determine status
        if (duedate == null) {
          // No due date → Pending (not counted in stats)
          status = 'Pending';
          if (submissiondate) {
            submittedDateStr = new Date(submissiondate * 1000).toLocaleDateString();
          }
        } else if (!record || submissiondate == null) {
          // Has due date but no submission → Missed
          status = 'Missed';
          missed++;
          strikes++;
        } else {
          // Has due date and submission → compare dates
          const due = new Date(duedate * 1000);
          const submitted = new Date(submissiondate * 1000);
          submittedDateStr = submitted.toLocaleDateString();

          if (submitted <= due) {
            status = 'On time';
            done++;
          } else {
            status = 'Late';
            late++;
            strikes++;
            const diffTime = submitted.getTime() - due.getTime();
            lateDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          }
        }

        // Parse grade safely
        const score = record?.grade ? parseFloat(record.grade) : undefined;
        const formattedScore = score != null && !isNaN(score) ? Math.round(score) : undefined;

        // Push deliverable object
        deliverables.push({
          title,
          status,
          score: formattedScore,
          submittedDate: submittedDateStr,
          lateDays,
        });
      });

      // Return full learner object
      return {
        ...base,
        deliverables,
        stats: { done, late, missed, strikes },
      };
    });

    return {
      selectedCohort: { id: selectedCohortId, name: selectedCohortId },
      learners,
    };
  }, [selectedCohortId, moodleData]);

  // ─── Modal Toggle Handler ────────────────────────────────────────────
  const toggleLearnerModal = (learner: Learner) => {
    setSelectedLearner(learner);
    setShowLearnerModal(true);
  };

  // ─── CSV Export Handler ──────────────────────────────────────────────
  // Exports full data: one column per quiz, plus summary stats.
  const handleExportCSV = () => {
    if (!selectedCohort || learners.length === 0) return;

    // Build header row
    const headers = ['Learner'];
    const allDeliverables = learners[0]?.deliverables || [];
    allDeliverables.forEach(d => headers.push(d.title));
    headers.push('Deliverables Done', 'Late Count', 'Missed Count', 'Total Strikes');

    // Build data rows
    const rows = learners.map(learner => {
      const row = [learner.name];
      learner.deliverables.forEach(d => {
        let cell = d.status;
        if (d.score !== undefined) cell += ` (${d.score}%)`;
        row.push(cell);
      });
      row.push(
        `${learner.stats.done}/${allDeliverables.length}`,
        learner.stats.late.toString(),
        learner.stats.missed.toString(),
        learner.stats.strikes.toString()
      );
      return row;
    });

    // Generate CSV content
    const csvLines = [
      headers.join(','),
      ...rows.map(r => r.map(cell => `"${cell}"`).join(','))
    ];
    const csvContent = csvLines.join('\n');

    // Trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cohort-${selectedCohort.name}-compliance-report.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ─── RENDER: UI ──────────────────────────────────────────────────────
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Cohort Compliance Reports</h1>

      {/* Cohort selector + Export button */}
      <div className="mb-6 flex gap-4 items-center">
        <label className="font-medium">Select Cohort:</label>
        <select
          value={selectedCohortId}
          onChange={(e) => setSelectedCohortId(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="">-- Select a Cohort --</option>
          {cohorts.map(cohort => (
            <option key={cohort.id} value={cohort.id}>
              {cohort.name}
            </option>
          ))}
        </select>

        {selectedCohort && (
          <button
            onClick={handleExportCSV}
            className="ml-auto bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            disabled={!learners.length}
          >
            Export CSV
          </button>
        )}
      </div>

      {/* Always render table shell (even when empty) */}
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">Learner</th>
              <th className="border p-2 text-left">Deliverables Done</th>
              <th className="border p-2 text-left">Late Count</th>
              <th className="border p-2 text-left">Missed Count</th>
              <th className="border p-2 text-left">Total Strikes</th>
            </tr>
          </thead>
          <tbody>
            {selectedCohort ? (
              learners.length > 0 ? (
                // Render learner rows
                learners.map(learner => (
                  <tr
                    key={learner.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => toggleLearnerModal(learner)}
                  >
                    <td className="border p-2">{learner.name}</td>
                    <td className="border p-2">
                      {learner.stats.done}/{learner.deliverables.length}
                    </td>
                    <td className="border p-2">{learner.stats.late}</td>
                    <td className="border p-2">{learner.stats.missed}</td>
                    <td className="border p-2">{learner.stats.strikes}</td>
                  </tr>
                ))
              ) : (
                // Empty cohort message
                <tr>
                  <td colSpan={5} className="border p-8 text-center text-gray-500 italic">
                    {moodleData.length === 0
                      ? "No compliance data found in Supabase. Ensure the Moodle plugin is sending data to `/submissions`."
                      : "No learners found for this cohort."}
                  </td>
                </tr>
              )
            ) : (
              // No cohort selected
              <tr>
                <td colSpan={5} className="border p-8 text-center text-gray-500 italic">
                  Select a cohort to view compliance reports.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showLearnerModal && selectedLearner && (
        <ModalLearnerDetails
          onClose={() => setShowLearnerModal(false)}
          selectedLearner={selectedLearner}
        />
      )}
    </div>
  );
};

export default ReportsTable;