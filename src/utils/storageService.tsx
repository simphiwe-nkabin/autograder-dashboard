import type { GradeRecord } from "../types/Reports";
import type { Submission, AutogradeWorkerLog, GradeRecordStorage } from "../types/storageTypes";

const BASE_URL = `${import.meta.env.VITE_SUPABASE_BASEURL}/submissions`;
const API_KEY = import.meta.env.VITE_SUPABASE_APIKEY;


async function getSubmission(submissionId: number): Promise<Submission | null> {
    try {
        const response = await fetch(`${BASE_URL}?submission_id=eq.${submissionId}&limit=1`, {
            headers: { 'apiKey': API_KEY }
        });
        if (!response.ok) return null;
        const data = await response.json();
        return data.length > 0 ? data[0] : null;
    } catch (error) {
        return null;
    }
}


async function upsertSubmission(submissionId: number, data: Partial<Pick<Submission, 'blocked' | 'comment'>>) {
    try {
        const existing = await getSubmission(submissionId);

        if (existing) {

            const response = await fetch(`${BASE_URL}?submission_id=eq.${submissionId}`, {
                method: 'PATCH',
                headers: { 'apiKey': API_KEY, 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`PATCH failed: ${response.status} ${await response.text()}`);
            }
        } else {

            const payload = {
                submission_id: submissionId,
                blocked: data.blocked ?? false,
                comment: data.comment ?? null
            };
            const response = await fetch(BASE_URL, {
                method: 'POST',
                headers: { 'apiKey': API_KEY, 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`POST failed: ${response.status} ${await response.text()}`);
            }
        }
        return true;
    } catch (error) {
        return false;
    }
}


async function getAllSubmissions(): Promise<Submission[]> {
    try {
        const response = await fetch(BASE_URL, {
            headers: { 'apiKey': API_KEY }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} ${await response.text()}`);
        }
        return await response.json();
    } catch (error) {
        return [];
    }
}


function createBlockedSubmission(submissionId: number) {
    return upsertSubmission(submissionId, { blocked: true });
}


function removeBlockedSubmission(submissionId: number) {
    return upsertSubmission(submissionId, { blocked: false });
}


function saveSubmissionComment(submissionId: number, comment: string) {
    const normalizedComment = !comment || comment.trim() === "" ? null : comment;
    return upsertSubmission(submissionId, { comment: normalizedComment });
}


function deleteSubmissionComment(submissionId: number) {
    return upsertSubmission(submissionId, { comment: null });
}


async function toggleBlockedStatus(submissionId: number, currentStatus: boolean) {
    return upsertSubmission(submissionId, { blocked: !currentStatus });
}


async function getAllBlockedSubmissions() {
    const submissions = await getAllSubmissions();
    return submissions.filter(s => s.blocked);
}


async function getSubmissionComments() {
    const submissions = await getAllSubmissions();
    return submissions.filter(s => s.comment);
}

// --- Old blocked table functions (KEEP for backward compatibility) ---

async function removeBlockedSubmissionLegacy(id: number) {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_BASEURL}/blocked_submission?submission_id=eq.${id}`, {
        method: 'DELETE',
        headers: { 'apiKey': import.meta.env.VITE_SUPABASE_APIKEY }
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return true;
}

async function updateBlockedSubmissionComment(id: number, comment: string) {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_BASEURL}/blocked_submission?submission_id=eq.${id}`, {
        method: 'PATCH',
        headers: {
            'apiKey': import.meta.env.VITE_SUPABASE_APIKEY,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ comment })
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return true;
}

// --- Autograde Worker Logs ---

export async function getAutogradeWorkerLogs(): Promise<AutogradeWorkerLog[]> {
    const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_BASEURL}/autograde_worker_log?select=*`,
        {
            method: 'GET',
            headers: {
                apikey: import.meta.env.VITE_SUPABASE_APIKEY as string
            }
        }
    );

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data as AutogradeWorkerLog[];
}

// ─── Fetch Compliance Data from Supabase ────────────────────────

const COMPLIANCE_BASE_URL = `${import.meta.env.VITE_SUPABASE_BASEURL}/grade_reports`;
const SUPABASE_API_KEY = import.meta.env.VITE_SUPABASE_APIKEY;




export async function getComplianceData(): Promise<GradeRecord[]> {
    try {
        const response = await fetch(COMPLIANCE_BASE_URL, {
            method: 'GET',
            headers: {
                apiKey: SUPABASE_API_KEY,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.error('Failed to fetch compliance data:', await response.text());
            return [];
        }

        const data: GradeRecordStorage[] = await response.json();

        // Optional: filter out malformed records
        return data.map(record => ({
            uid: record.uid || "",
            coursename: record.coursename || "",
            groupname: record.groupname || "",
            userid: parseInt(record?.userid),
            firstname: record.firstname || "",
            lastname: record.lastname || "",
            activitytype: record.activitytype || "",
            activityname: record.activityname || "",
            grade: record.grade ? parseFloat(record.grade) : null,
            duedate: record.duedate ? new Date(parseInt(record.duedate, 10)) : null,
            submissiondate: record.submissiondate ? new Date(parseInt(record.submissiondate, 10)) : null,
            submissionstatus: record.submissionstatus
        }));
    } catch (error) {
        console.error('Error in getComplianceData:', error);
        return [];
    }
}


export default {
    getComplianceData,
    getAllSubmissions,
    createBlockedSubmission,
    removeBlockedSubmission,
    saveSubmissionComment,
    deleteSubmissionComment,
    toggleBlockedStatus,

    getAllBlockedSubmissions,
    getSubmissionComments,

    // Old table compatibility
    removeBlockedSubmissionLegacy,
    updateBlockedSubmissionComment,

    // Logs
    getAutogradeWorkerLogs
};
