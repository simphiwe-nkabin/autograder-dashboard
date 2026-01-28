
import { useState } from "react";

import ModalLearnerDetails from "./ModalLearnerDetails";
import { mockCohorts, mockReportData } from "../mocks/Reports";
import type { LearnerReport } from "../types/Reports";

const ReportsTable = () => {
	//Track which cohort is selected
	const [selectedCohortId, setSelectedCohortId] = useState("");

	// learner modal details state
	const [showLearnerModal, setShowLearnerModal] = useState<boolean>(false);
  const [selectedLearner, setSelectedLearner] = useState<LearnerReport | null>(
		null,
	);


	// show/hide learner modal
	const toggleLearnerModal = (learner: LearnerReport | null) => {
		setSelectedLearner(learner);
		setShowLearnerModal(!showLearnerModal);
	};


	// Get the selected cohort and its report data
	const selectedCohort = mockCohorts.find(
		(cohort) => cohort.id === selectedCohortId,
	);
	const learners = mockReportData[selectedCohortId] || [];

	// Export data as CSV when button is clicked
	const handleExportCSV = () => {
		if (!selectedCohort || learners.length === 0) return;

		// Build the first row: column headers
		const headers = ["Learner"];
		if (learners.length > 0) {
			for (const deliverable of learners[0].deliverables) {
				headers.push(deliverable.title);
			}
		}
		headers.push(
			"Deliverables Done",
			"Late Count",
			"Missed Count",
			"Total Strikes",
		);

		// Build each row of data
		const rows = [];
		for (const learner of learners) {
			const row = [learner.name];

			// Add status for each deliverable
			for (const d of learner.deliverables) {
				let cell = d.status;
				if (d.score !== undefined) {
					cell += ` (${d.score}%)`;
				}
				row.push(cell);
			}

			// Add summary stats
			row.push(
				`${learner.stats.done}/${learner.deliverables.length}`,
				learner.stats.late.toString(),
				learner.stats.missed.toString(),
				learner.stats.strikes.toString(),
			);
			rows.push(row);
		}

		// Turn data into CSV text
		const csvLines = [
			headers.join(","),
			...rows.map((r) => r.map((cell) => `"${cell}"`).join(",")),
		];
		const csvContent = csvLines.join("\n");

		// Create a download link and click it
		const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = `cohort-${selectedCohort.name}-compliance-report.csv`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	// Render the UI
	return (
		<>
			<div className="p-6">
				<h1 className="text-2xl font-bold mb-6">Cohort Compliance Reports</h1>

				{/* Cohort selector */}
				<div className="mb-6 flex gap-4 items-center">
					<label className="font-medium">Select Cohort:</label>
					<select
						value={selectedCohortId}
						onChange={(e) => setSelectedCohortId(e.target.value)}
						className="border rounded px-3 py-2">
						<option value="">-- Select a Cohort --</option>
						{mockCohorts.map((cohort) => (
							<option key={cohort.id} value={cohort.id}>
								{cohort.name}
							</option>
						))}
					</select>

					{/* Show export button only if a cohort is selected */}
					{selectedCohort && (
						<button
							onClick={handleExportCSV}
							className="ml-auto bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
							Export CSV
						</button>
					)}
				</div>

				{/* Show table or message */}
				{selectedCohort ? (
					learners.length > 0 ? (
						<div className="overflow-x-auto">
							<table className="min-w-full border-collapse border border-gray-300">
								<thead>
									<tr className="bg-gray-100">
										<th className="border p-2 text-left">Learner</th>
										{/* {learners[0].deliverables.map((d, i) => (
                    <th key={i} className="border p-2 text-left">
                      {d.title}
                    </th>
                  ))} */}
										<th className="border p-2 text-left">Deliverables Done</th>
										<th className="border p-2 text-left">Late Count</th>
										<th className="border p-2 text-left">Missed Count</th>
										<th className="border p-2 text-left">Total Strikes</th>
									</tr>
								</thead>
								<tbody>
									{learners.map((learner, index) => (
										<tr
											key={index}
											className="hover:bg-gray-50"
											onClick={() => toggleLearnerModal(learner)}>
											<td className="border p-2 cursor-pointer">
												{learner.name}
											</td>
											{/* {learner.deliverables.map((d, i) => (
                      <td
                        key={i}
                        className={`border p-2 ${
                          d.status === 'On time'
                            ? 'text-green-700 bg-green-50'
                            : d.status === 'Late'
                            ? 'text-yellow-700 bg-yellow-50 font-semibold'
                            : d.status === 'Missed'
                            ? 'text-red-700 bg-red-50 font-bold'
                            : 'text-gray-500 italic'
                        }`}
                      >
                        {d.status}
                        {d.score !== undefined && ` (${d.score}%)`}
                      </td>
                    ))} */}
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
			{showLearnerModal && (
				<ModalLearnerDetails
					onClose={() => setShowLearnerModal(false)}
					selectedLearner={
						selectedLearner && selectedCohort
							? {
									...selectedLearner,
									cohort: selectedCohort.name,
							  }
							: null
					}
				/>
			)}
		</>
	);
};;

export default ReportsTable;