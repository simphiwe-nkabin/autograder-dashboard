import React from 'react';
import type { Learner } from '../types/Reports';
import { clsx } from 'clsx';
import moment from 'moment';

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

	return (
		<div className="w-screen h-screen fixed top-0 left-0 grid place-items-center bg-black/60 z-50">
			<div className="bg-white p-6 rounded-xl shadow-2xl w-[90vw] max-h-[90vh] overflow-y-auto relative">
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
					<strong>Status:</strong>
					<span className="text-red-600 font-semibold">{stats.strikes >= 3 && ' At Risk'}</span>
					<span className="text-amber-600 font-semibold">{(stats.strikes > 0 && stats.strikes < 3) && ' Monitor'}</span>
					<span className="text-green-600 font-semibold">{stats.strikes == 0 && ' Good Standing'}</span>
				</div>

				<div className="mt-6 grid grid-cols-3 gap-5">
					{deliverables
						.sort((a, b) => {
							const nextYear = new Date()
							nextYear.setFullYear(nextYear.getFullYear() + 1)
							return new Date(a.dueDate || nextYear).getTime() - new Date(b.dueDate || nextYear)?.getTime()
						})
						.map((d, index) => (
							<div key={index} className="relative border border-gray-200 bg-gray-50 rounded py-2 px-3 flex flex-col justify-between">
								<span className='absolute start-[-10px] top-[-10px] text-xs border border-gray-200 rounded-2xl w-6 h-6 flex items-center justify-center bg-gray-100 text-gray-700'>{index + 1}</span>
								<div className="flex justify-between items-start">
									<h3 className="font-semibold mb-2">{d.title}</h3>
									<span className="text-xs bg-gray-200 px-2 py-1 rounded capitalize">
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
									<div className="text-sm text-gray-500 text-xs">
										{(d.submittedDate && d.status == 'ontime') && <span>{`submitted ${moment(d.submittedDate).fromNow()}`}</span>}
										{(d.status == 'missed' && d.dueDate) && <span>{`due ${moment(d.dueDate).fromNow()}`}</span>}
										{(d.status == 'pending' && d.dueDate) && <span>{`due ${moment(d.dueDate).fromNow()}`}</span>}
										{(d.status == 'late' && d.dueDate && d.submittedDate) && <span>{`${moment(d.submittedDate).diff(moment(d.dueDate), 'days')} days late`}</span>}
									</div>
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