import type { Submission } from "../types/storageTypes";

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

export default {
    getAllSubmissions,
    createBlockedSubmission,
    removeBlockedSubmission,
    saveSubmissionComment,
    deleteSubmissionComment,
    toggleBlockedStatus,
  
    getAllBlockedSubmissions,
    getSubmissionComments
};