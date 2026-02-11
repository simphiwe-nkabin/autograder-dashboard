import React from 'react';
import type { Learner } from '../types/Reports';
import { clsx } from 'clsx';

interface ModalLearnerDetailsProps {
	onClose: () => void;
	selectedLearner: Learner | null;
}

const ModalLearnerDetails: React.FC<ModalLearnerDetailsProps> = ({
	onClose,
	selectedLearner,
}) => {
	if (!selectedLearner) return null;

	const { name, cohort, stats, deliverables } = selectedLearner;

	const isAtRisk = stats.strikes >= 3 || stats.missed > 0;
	const statusText = isAtRisk ? (
		<span className="text-red-600 font-semibold">At Risk</span>
	) : (
		<span className="text-green-600">Good Standing</span>
	);

	return (
		<div className="w-screen h-screen fixed top-0 left-0 grid place-items-center bg-black/60 z-50">
			<div className="bg-white p-6 rounded-xl shadow-2xl w-[500px] max-h-[90vh] overflow-y-auto relative">
				<button
					className="absolute top-4 right-4 text-xl font-bold text-gray-500 hover:text-gray-700"
					onClick={onClose}>
					×
				</button>

				<h2 className="text-xl font-bold mb-1">{name}</h2>
				<p className="text-sm text-gray-600 mb-4">{cohort}</p>

				<div className="flex gap-4 text-sm mb-4 border-b pb-3">
					<span>
						Completed:{" "}
						<strong>
							{stats.done} / {deliverables.length}
						</strong>
					</span>
					<span>
						Late: <strong>{stats.late}</strong>
					</span>
					<span>
						Missed: <strong>{stats.missed}</strong>
					</span>
					<span>
						Strikes: <strong>{stats.strikes}</strong>
					</span>
				</div>

				<div className="mb-4">
					<strong>Status:</strong> {statusText}
				</div>

				<div className="space-y-4 mt-6">
					{deliverables.map((d, index) => (
						<div key={index} className="border-t pt-3 first:border-t-0">
							<div className="flex justify-between items-start">
								<h3 className="font-semibold mb-2">{d.title}</h3>
								<span className="text-xs bg-gray-100 px-2 py-1 rounded capitalize">
									{d.activityType == "assign" ? "assignment" : d.activityType}
								</span>
							</div>
							<div className='flex gap-2 items-center'>
								<span className={clsx('border rounded-2xl py-0.5 px-1.5 text-xs',
									{ 'bg-red-100 border-red-500 text-red-500': d.status == 'missed' },
									{ 'bg-green-100 border-green-500 text-green-500': d.status == 'ontime' },
									{ 'bg-gray-100 border-gray-500 text-gray-500': d.status == 'pending' },
									{ 'bg-gray-100 border-gray-500 text-gray-500': d.status == 'pending' },
									{ 'bg-amber-100 border-amber-500 text-amber-500': d.status == 'late' }
								)}>{d.status}</span>
								<p className="text-sm text-gray-600 mt-1">
									{d.submittedDate && d.submittedDate.toLocaleDateString()}
								</p>
							</div>
							{d.score && (
								<p className="text-sm text-gray-700 mt-1">Score: {d.score}%</p>
							)}
						</div>
					))}
				</div>
			</div>
		</div>
	);
};;

export default ModalLearnerDetails;