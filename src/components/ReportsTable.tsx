import { useState, useEffect, useMemo } from 'react';
import ModalLearnerDetails from './ModalLearnerDetails';
import { getComplianceData } from '../utils/storageService';

// ─── Types (match your Moodle payload) ───────────────────────────

interface MoodleRecord {
  uid: string;
  coursename: string;
  groupname: string;
  userid: string;
  firstname: string;
  lastname: string;
  activitytype: string;
  activityname: string;
  grade: string;          // e.g., "85.00"
  duedate: string;        // Unix timestamp as string
  submissiondate: string; // Unix timestamp as string
  submissionstatus: string;
}

interface Deliverable {
  title: string;
  status: 'On time' | 'Late' | 'Missed' | 'Pending';
  score?: number;
  submittedDate: string;
  lateDays: number;
}

interface Learner {
  id: string;
  name: string;
  cohort: string;
  deliverables: Deliverable[];
  stats: {
    done: number;
    late: number;
    missed: number;
    strikes: number;
  };
}

interface Cohort {
  id: string;
  name: string;
}

// ─── Helper: Parse Timestamp Safely ──────────────────────────────

const parseTimestamp = (value: string | number | null | undefined): number | null => {
  if (value == null || value === '' || value === '0' || value === 'null') return null;
  const num = typeof value === 'string' ? parseInt(value, 10) : value;
  return isNaN(num) ? null : num;
};

// ─── Component ───────────────────────────────────────────────────

const ReportsTable = () => {
  const [moodleData, setMoodleData] = useState<MoodleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCohortId, setSelectedCohortId] = useState<string>('');
  const [showLearnerModal, setShowLearnerModal] = useState<boolean>(false);
  const [selectedLearner, setSelectedLearner] = useState<Learner | null>(null);

  // Fetch from /submissions via storageService
  useEffect(() => {
    getComplianceData()
      .then(data => {
        console.log('Loaded compliance records:', data.length);
        setMoodleData(data);
      })
      .catch(err => {
        console.error('Failed to load compliance ', err);
        setMoodleData([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Extract cohorts
  const cohorts = useMemo<Cohort[]>(() => {
    if (!Array.isArray(moodleData)) return [];
    const groups = [...new Set(moodleData.map(item => item.groupname))];
    return groups.map(name => ({ id: name, name }));
  }, [moodleData]);

  // Transform data into learners
  const { selectedCohort, learners } = useMemo<{
    selectedCohort: Cohort | null;
    learners: Learner[];
  }>(() => {
    if (!selectedCohortId || !Array.isArray(moodleData)) {
      return { selectedCohort: null, learners: [] };
    }

    const cohortItems = moodleData.filter(item => item.groupname === selectedCohortId);
    if (cohortItems.length === 0) {
      return {
        selectedCohort: { id: selectedCohortId, name: selectedCohortId },
        learners: [],
      };
    }

    const deliverableTitles = [...new Set(cohortItems.map(item => item.activityname))].sort();

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

    const learners: Learner[] = Array.from(learnerMap.entries()).map(([key, base]) => {
      const rawRecords = cohortItems.filter(
        item => `${item.userid}|${item.firstname}|${item.lastname}` === key
      );

      const deliverables: Deliverable[] = [];
      let done = 0, late = 0, missed = 0, strikes = 0;

      deliverableTitles.forEach(title => {
        const record = rawRecords.find(r => r.activityname === title);
        const duedate = parseTimestamp(record?.duedate);
        const submissiondate = parseTimestamp(record?.submissiondate);

        let status: 'On time' | 'Late' | 'Missed' | 'Pending' = 'Pending';
        let submittedDateStr = '—';
        let lateDays = 0;

        if (duedate == null) {
          status = 'Pending';
          if (submissiondate) {
            submittedDateStr = new Date(submissiondate * 1000).toLocaleDateString();
          }
        } else if (!record || submissiondate == null) {
          status = 'Missed';
          missed++;
          strikes++;
        } else {
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

        const score = record?.grade ? parseFloat(record.grade) : undefined;
        const formattedScore = score != null && !isNaN(score) ? Math.round(score) : undefined;

        deliverables.push({
          title,
          status,
          score: formattedScore,
          submittedDate: submittedDateStr,
          lateDays,
        });
      });

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

  const toggleLearnerModal = (learner: Learner) => {
    setSelectedLearner(learner);
    setShowLearnerModal(true);
  };

  // ─── Export CSV ─

  const handleExportCSV = () => {
    if (!selectedCohort || learners.length === 0) return;

    const headers = ['Learner'];
    const allDeliverables = learners[0]?.deliverables || [];
    allDeliverables.forEach(d => headers.push(d.title));
    headers.push('Deliverables Done', 'Late Count', 'Missed Count', 'Total Strikes');

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

    const csvLines = [
      headers.join(','),
      ...rows.map(r => r.map(cell => `"${cell}"`).join(','))
    ];
    const csvContent = csvLines.join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cohort-${selectedCohort.name}-compliance-report.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ─── Render ────────────────────────────────────────────────────

  if (loading) {
    return <div className="p-6 text-gray-500">Loading compliance data...</div>;
  }

  if (moodleData.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-10 text-gray-500">
          <p>No compliance data found in Supabase.</p>
          <p className="text-sm mt-2">Ensure Moodle plugin is sending data to <code>/submissions</code>.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Cohort Compliance Reports</h1>

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
              className="ml-auto bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Export CSV
            </button>
          )}
        </div>

        {selectedCohort ? (
          learners.length > 0 ? (
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
                  {learners.map(learner => (
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
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center mt-10">
              No report data available for this cohort.
            </p>
          )
        ) : (
          <p className="text-gray-500 text-center mt-10">
            Please select a cohort to view its compliance report.
          </p>
        )}
      </div>

      {showLearnerModal && selectedLearner && (
        <ModalLearnerDetails
          onClose={() => setShowLearnerModal(false)}
          selectedLearner={selectedLearner}
        />
      )}
    </>
  );
};

export default ReportsTable;