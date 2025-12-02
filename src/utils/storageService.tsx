import type { Submission, BlockedSubmission, AutogradeWorkerLog } from "../types/storageTypes";

const BASE_URL = `${import.meta.env.VITE_SUPABASE_BASEURL}/submissions`;
const API_KEY = import.meta.env.VITE_SUPABASE_APIKEY;

// --- Private Helper Functions ---

/**
 * Fetches a submission by its ID. Returns null if not found.
 */
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

/**
 * The single source of truth for creating or updating a submission.
 * This function handles all updates atomically.
 */
async function upsertSubmission(submissionId: number, data: Partial<Pick<Submission, 'blocked' | 'comment'>>) {
    try {
        const existing = await getSubmission(submissionId);
        
        if (existing) {
            // --- UPDATE (PATCH) ---
            const response = await fetch(`${BASE_URL}?submission_id=eq.${submissionId}`, {
                method: 'PATCH',
                headers: { 'apiKey': API_KEY, 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`PATCH failed: ${response.status} ${await response.text()}`);
            }
        } else {
            // --- CREATE (POST) ---
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

// --- Public API ---

/**
 * Fetch all submissions from the unified submissions table.
 */
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

/**
 * Blocks a submission.
 */
function createBlockedSubmission(submissionId: number) {
    return upsertSubmission(submissionId, { blocked: true });
}

/**
 * Unblocks a submission.
 */
function removeBlockedSubmission(submissionId: number) {
    return upsertSubmission(submissionId, { blocked: false });
}

/**
 * Saves a comment for a submission.
 */
function saveSubmissionComment(submissionId: number, comment: string) {
    const normalizedComment = !comment || comment.trim() === "" ? null : comment;
    return upsertSubmission(submissionId, { comment: normalizedComment });
}

/**
 * Deletes a submission's comment (sets it to null).
 */
function deleteSubmissionComment(submissionId: number) {
    return upsertSubmission(submissionId, { comment: null });
}

/**
 * Toggles the blocked status of a submission.
 */
async function toggleBlockedStatus(submissionId: number, currentStatus: boolean) {
    return upsertSubmission(submissionId, { blocked: !currentStatus });
}

// --- Legacy/Compatibility Functions ---

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



export default {
    getAllSubmissions,
    createBlockedSubmission,
    removeBlockedSubmission,
    saveSubmissionComment,
    deleteSubmissionComment,
    toggleBlockedStatus,

    // Compatibility exports
    getAllBlockedSubmissions,
    getSubmissionComments,

    // Old table compatibility
    removeBlockedSubmissionLegacy,
    updateBlockedSubmissionComment,

    // Logs
    getAutogradeWorkerLogs
};
