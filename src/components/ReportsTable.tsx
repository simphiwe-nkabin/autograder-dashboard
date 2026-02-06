

import { useState, useEffect, useMemo } from 'react';
import ModalLearnerDetails from './ModalLearnerDetails';
import { getComplianceData } from '../utils/storageService';
import type { Learner } from '../types/Reports';

// ─── Raw Data Type (normalized to strings) ────────────────────────────
interface MoodleRawRecord {
  groupname: string;
  userid: string;
  firstname: string;
  lastname: string;
  activityname: string;
  grade: string;
  duedate: string;
  submissiondate: string;
}

// ─── Helper: Parse Timestamp Safely ───────────────────────────────────
const parseTimestamp = (value: string | number | null | undefined): number | null => {
  if (value == null || value === '' || value === '0' || value === 'null') return null;
  const num = typeof value === 'string' ? parseInt(value, 10) : value;
  return isNaN(num) ? null : num;
};

// ─── Main Component ───────────────────────────────────────────────────
const ReportsTable = () => {
  const [moodleData, setMoodleData] = useState<MoodleRawRecord[]>([]);
  const [selectedCohortId, setSelectedCohortId] = useState<string>('');
  const [showLearnerModal, setShowLearnerModal] = useState<boolean>(false);
  const [selectedLearner, setSelectedLearner] = useState<Learner | null>(null);

  // ─── EFFECT: Fetch and Normalize Data ───────────────────────────────
  useEffect(() => {
    console.log('🔍 ReportsTable: Starting fetch from /grade_reports...');
    
    getComplianceData()
      .then(data => {
        console.log('✅ ReportsTable: Received raw', data.length, 'records');
        if (data.length > 0) {
          console.log('🔍 Sample raw record:', data[0]);
        }

        // Normalize all records to expected shape
        const normalizedData: MoodleRawRecord[] = data.map((item: any) => ({
          groupname: String(item.groupname ?? item.cohort ?? '').trim(),
          userid: String(item.userid ?? item.user_id ?? item.id ?? '').trim(),
          firstname: String(
            item.firstname ??
            item.first_name ??
            (item.fullname ? item.fullname.split(' ')[0] : '') ??
            ''
          ).trim(),
          lastname: String(
            item.lastname ??
            item.last_name ??
            (item.fullname ? item.fullname.split(' ').slice(1).join(' ') : '') ??
            ''
          ).trim(),
          activityname: String(
            item.activityname ??
            item.name ??
            item.title ??
            item.quiz_name ??
            ''
          ).trim(),
          grade: String(item.grade ?? item.score ?? '0.00').trim(),
          duedate: String(
            item.duedate ??
            item.due_date ??
            item.deadline ??
            item.timeclose ??
            ''
          ).trim(),
          submissiondate: String(
            item.submissiondate ??
            item.submitted_at ??
            item.timefinish ??
            item.timemodified ??
            ''
          ).trim(),
        }));

        // Filter out invalid records
        const validData = normalizedData.filter(
          item =>
            item.groupname !== '' &&
            item.userid !== '' &&
            item.activityname !== ''
        );

        console.log('✅ ReportsTable: Valid records after normalization:', validData.length);
        if (validData.length > 0) {
          console.log('📌 Sample normalized record:', validData[0]);
        }
        setMoodleData(validData);
      })
      .catch(err => {
        console.error('❌ ReportsTable: Failed to load compliance ', err);
        setMoodleData([]);
      });
  }, []);

  // ─── MEMO: Extract Cohorts ──────────────────────────────────────────
  const cohorts = useMemo<{ id: string; name: string }[]>(() => {
    const uniqueGroupnames = [...new Set(moodleData.map(item => item.groupname))];
    return uniqueGroupnames.map(name => ({ id: name, name }));
  }, [moodleData]);

  // ─── MEMO: Transform to Learners ─────────────────────────────────────
  const { selectedCohort, learners } = useMemo<{
    selectedCohort: { id: string; name: string } | null;
    learners: Learner[];
  }>(() => {
    if (!selectedCohortId) {
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
          name: `${item.firstname} ${item.lastname}`.trim() || 'Unknown User',
          cohort: item.groupname,
        });
      }
    });

    const learners: Learner[] = Array.from(learnerMap.entries()).map(([key, base]) => {
      const rawRecords = cohortItems.filter(
        item => `${item.userid}|${item.firstname}|${item.lastname}` === key
      );

      const deliverables = [];
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

  // ─── Handlers ────────────────────────────────────────────────────────
  const toggleLearnerModal = (learner: Learner) => {
    setSelectedLearner(learner);
    setShowLearnerModal(true);
  };

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

  // ─── RENDER ──────────────────────────────────────────────────────────
  return (
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
            className="ml-auto bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            disabled={!learners.length}
          >
            Export CSV
          </button>
        )}
      </div>

      {/* Always render table shell */}
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
                <tr>
                  <td colSpan={5} className="border p-8 text-center text-gray-500 italic">
                    {moodleData.length === 0
                      ? "No compliance data found. Ensure Moodle plugin sends to `/grade_reports`."
                      : "No learners found for this cohort."}
                  </td>
                </tr>
              )
            ) : (
              <tr>
                <td colSpan={5} className="border p-8 text-center text-gray-500 italic">
                  Select a cohort to view compliance reports.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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