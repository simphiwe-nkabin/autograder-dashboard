import React from 'react';
import type { Learner } from '../types/Reports';



interface ModalLearnerDetailsProps {
  onClose: () => void;
  selectedLearner: Learner | null; // allow null
}

const ModalLearnerDetails: React.FC<ModalLearnerDetailsProps> = ({ onClose, selectedLearner }) => {
  if (!selectedLearner) return null; // early return

  const { name, cohort, stats, deliverables } = selectedLearner;

  const getStatusDisplay = (status: string, lateDays: number) => {
    switch (status) {
      case 'On time':
        return <span className="text-green-600">On time</span>;
      case 'Late':
        return <span className="text-red-600">Late by {lateDays} day{lateDays !== 1 ? 's' : ''}</span>;
      case 'Missed':
        return <span className="text-gray-500 italic">Not submitted</span>;
      default:
        return <span className="text-gray-500">{status}</span>;
    }
  };

  const isAtRisk = stats.strikes >= 3 || stats.missed > 0;
  const statusText = isAtRisk ? (
    <span className="text-red-600 font-semibold">🚨 At Risk</span>
  ) : (
    <span className="text-green-600">Good Standing</span>
  );

  return (
    <div className="w-screen h-screen fixed top-0 left-0 grid place-items-center bg-black/60 z-50">
      <div className="bg-white p-6 rounded-xl shadow-2xl w-[500px] max-h-[90vh] overflow-y-auto relative">
        <button
          className="absolute top-4 right-4 text-xl font-bold text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          ×
        </button>

        <h2 className="text-xl font-bold mb-1">{name}</h2>
        <p className="text-sm text-gray-600 mb-4">{cohort}</p>

        <div className="flex gap-4 text-sm mb-4 border-b pb-3">
          <span>Completed: <strong>{stats.done} / {deliverables.length}</strong></span>
          <span>Late: <strong>{stats.late}</strong></span>
          <span>Missed: <strong>{stats.missed}</strong></span>
          <span>Strikes: <strong>{stats.strikes}</strong></span>
        </div>

        <div className="mb-4">
          <strong>Status:</strong> {statusText}
        </div>

        <div className="space-y-4 mt-6">
          {deliverables.map((d, index) => (
            <div key={index} className="border-t pt-3 first:border-t-0">
              <h3 className="font-semibold">{d.title}</h3>
              {d.score !== undefined && (
                <p className="text-sm text-gray-700">Score: {d.score}%</p>
              )}
              <p className="text-sm text-gray-600">
                Submitted: {d.submittedDate} ({getStatusDisplay(d.status, d.lateDays)})
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ModalLearnerDetails;