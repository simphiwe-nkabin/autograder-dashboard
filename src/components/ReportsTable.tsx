import { useState, useEffect, useMemo } from "react";
import ModalLearnerDetails from "./ModalLearnerDetails";
import { getComplianceData } from "../utils/storageService";
import type { Deliverable, GradeRecord, Learner } from "../types/Reports";

//Main Component
const ReportsTable = () => {
	const [moodleData, setMoodleData] = useState<GradeRecord[]>([]);
	const [selectedCohortId, setSelectedCohortId] = useState<string>("");
	const [showLearnerModal, setShowLearnerModal] = useState<boolean>(false);
	const [selectedLearner, setSelectedLearner] = useState<Learner | null>(null);

	//EFFECT: Fetch and Normalize Data
	useEffect(() => {
		getComplianceData()
			.then((data) => setMoodleData(data))
			.catch((err) => console.error("Failed to load compliance data ", err));
	}, []);

	//  MEMO: Extract Cohorts
	const cohorts = useMemo<{ id: string; name: string }[]>(() => {
		const uniqueGroupnames = [
			...new Set(moodleData.map((item) => item.groupname)),
		];
		return uniqueGroupnames.map((name) => ({ id: name, name }));
	}, [moodleData]);

	// MEMO: Transform to Learners
	const { selectedCohort, learners } = useMemo<{
		selectedCohort: { id: string; name: string } | null;
		learners: Learner[];
	}>(() => {
		if (!selectedCohortId) {
			return { selectedCohort: null, learners: [] };
		}

		const cohortItems = moodleData.filter(
			(item) => item.groupname === selectedCohortId,
		);
		if (cohortItems.length === 0) {
			return {
				selectedCohort: { id: selectedCohortId, name: selectedCohortId },
				learners: [],
			};
		}

		const deliverableTitles = [
			...new Set(cohortItems.map((item) => item.activityname)),
		].sort();

		const learnerMap = new Map<
			string,
			Omit<Learner, "deliverables" | "stats">
		>();
		cohortItems.forEach((item) => {
			const key = `${item.userid}|${item.firstname}|${item.lastname}`;
			if (!learnerMap.has(key)) {
				learnerMap.set(key, {
					id: item.userid,
					name: `${item.firstname} ${item.lastname}`.trim() || "Unknown User",
					cohort: item.groupname,
				});
			}
		});

		const learners: Learner[] = Array.from(learnerMap.entries()).map(
			([key, base]) => {
				const rawRecords = cohortItems.filter(
					(item) => `${item.userid}|${item.firstname}|${item.lastname}` === key,
				);

				const deliverables: Deliverable[] = [];
				let done = 0,
					late = 0,
					missed = 0,
					strikes = 0;

				deliverableTitles.forEach((title) => {
					const record = rawRecords.find((r) => r.activityname === title);

					if (record?.submissionstatus == 'missed') {
						missed++;
						strikes++;
					}
					if (record?.submissionstatus == 'ontime') {
						done++;
					}
					if (record?.submissionstatus == 'late') {
						late++;
						strikes++;
					}

					const score = record?.grade || null;

					// Pass activityType to modal
					deliverables.push({
						title,
						status: record?.submissionstatus || "pending",
						score,
						submittedDate: record?.submissiondate || null,
						activityType: record?.activitytype ?? "unknown",
						dueDate: record?.duedate || null
					});
				});

				return {
					...base,
					deliverables,
					stats: { done, late, missed, strikes },
				};
			},
		);

		return {
			selectedCohort: { id: selectedCohortId, name: selectedCohortId },
			learners,
		};
	}, [selectedCohortId, moodleData]);

	//Handlers
	const toggleLearnerModal = (learner: Learner) => {
		setSelectedLearner(learner);
		setShowLearnerModal(true);
	};

	// Helper: escape a value for CSV (RFC 4180 compliant)
	const escapeCSVCell = (value: string): string => {
		// Wrap in quotes and escape any internal double-quotes by doubling them
		const escaped = value.replace(/"/g, '""');
		return `"${escaped}"`;
	};

	const handleExportCSV = () => {
		if (!selectedCohort || learners.length === 0) return;

		// Build headers: Learner | [each deliverable title] | summary columns
		const allDeliverables = learners[0]?.deliverables || [];
		const headers = [
			"Learner",
			...allDeliverables.map((d) => d.title),
			"Deliverables Done",
			"Late Count",
			"Missed Count",
			"Total Strikes",
		];

		const rows = learners.map((learner) => {
			// One cell per deliverable (same order as headers)
			const deliverableCells = learner.deliverables.map((d) => {
				let cell = d.status;
				if (d.score !== null) cell += ` (${d.score}%)`;
				return cell;
			});

			// Summary cells — always 4, always at the end
			const summaryCells = [
				`${learner.stats.done}/${allDeliverables.length}`,
				String(learner.stats.late),
				String(learner.stats.missed),
				String(learner.stats.strikes),
			];

			return [learner.name, ...deliverableCells, ...summaryCells];
		});

		const csvLines = [
			headers.map(escapeCSVCell).join(","),
			...rows.map((row) => row.map(escapeCSVCell).join(",")),
		];
		const csvContent = csvLines.join("\n");

		const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = `cohort-${selectedCohort.name}-compliance-report.csv`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	};

	// RENDER
	return (
		<div className="p-6">
			<h1 className="text-2xl font-bold mb-6">Cohort Compliance Reports</h1>

			<div className="mb-6 flex gap-4 items-center">
				<label className="font-medium">Select Cohort:</label>
				<select
					value={selectedCohortId}
					onChange={(e) => setSelectedCohortId(e.target.value)}
					className="border rounded px-3 py-2">
					<option value="">-- Select a Cohort --</option>
					{cohorts.map((cohort) => (
						<option key={cohort.id} value={cohort.id}>
							{cohort.name}
						</option>
					))}
				</select>

				{selectedCohort && (
					<button
						onClick={handleExportCSV}
						className="ml-auto bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
						disabled={!learners.length}>
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
								learners.map((learner) => (
									<tr
										key={learner.id}
										className="hover:bg-gray-50 cursor-pointer"
										onClick={() => toggleLearnerModal(learner)}>
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
									<td
										colSpan={5}
										className="border p-8 text-center text-gray-500 italic">
										{moodleData.length === 0
											? "No compliance data found. Ensure Moodle plugin sends to `/grade_reports`."
											: "No learners found for this cohort."}
									</td>
								</tr>
							)
						) : (
							<tr>
								<td
									colSpan={5}
									className="border p-8 text-center text-gray-500 italic">
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
