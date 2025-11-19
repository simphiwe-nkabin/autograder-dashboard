import type { BlockedSubmission } from "../types/storageTypes";

async function getAllBlockedSubmissions() {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_BASEURL}/blocked_submission`, {
        headers: {
            'apiKey': import.meta.env.VITE_SUPABASE_APIKEY
        }
    })

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: BlockedSubmission[] = await response.json()
    return result
}

async function createBlockedSubmission(id: number) {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_BASEURL}/blocked_submission`, {
        method: 'POST',
        headers: {
            'apiKey': import.meta.env.VITE_SUPABASE_APIKEY,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ submission_id: id, comment: "" })
    })

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return true
}

async function removeBlockedSubmission(id: number) {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_BASEURL}/blocked_submission?submission_id=eq.${id}`, {
        method: 'DELETE',
        headers: {
            'apiKey': import.meta.env.VITE_SUPABASE_APIKEY
        }
    })

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return true
}

async function updateBlockedSubmissionComment(id: number, comment: string) {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_BASEURL}/blocked_submission?submission_id=eq.${id}`, {
        method: 'PATCH',
        headers: {
            'apiKey': import.meta.env.VITE_SUPABASE_APIKEY,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ comment })
    })

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return true
}

async function saveSubmissionComment(id: number, comment: string) {
    try {
        // If comment is empty, delete the record
        if (!comment || comment.trim() === "") {
            return deleteSubmissionComment(id)
        }
        
        // Always try to create first (since we're using UNIQUE constraint)
        const postResponse = await fetch(`${import.meta.env.VITE_SUPABASE_BASEURL}/submission_comments`, {
            method: 'POST',
            headers: {
                'apiKey': import.meta.env.VITE_SUPABASE_APIKEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ submission_id: id, comment })
        })

        if (postResponse.ok) {
            return true
        }

        // If POST fails (likely duplicate), try PATCH
        const patchResponse = await fetch(`${import.meta.env.VITE_SUPABASE_BASEURL}/submission_comments?submission_id=eq.${id}`, {
            method: 'PATCH',
            headers: {
                'apiKey': import.meta.env.VITE_SUPABASE_APIKEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ comment })
        })

        if (patchResponse.ok) {
            return true
        }

        const errorData = await patchResponse.json()
        throw new Error(`HTTP error! status: ${patchResponse.status}`);
    } catch (error) {
        throw error
    }
}

async function deleteSubmissionComment(id: number) {
    try {
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_BASEURL}/submission_comments?submission_id=eq.${id}`, {
            method: 'DELETE',
            headers: {
                'apiKey': import.meta.env.VITE_SUPABASE_APIKEY
            }
        })

        if (!response.ok) {
            return false
        }

        return true
    } catch (error) {
        return false
    }
}

async function getSubmissionComments() {
    try {
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_BASEURL}/submission_comments`, {
            headers: {
                'apiKey': import.meta.env.VITE_SUPABASE_APIKEY
            }
        })

        if (!response.ok) {
            return []
        }

        const comments = await response.json()
        return comments
    } catch (error) {
        return []
    }
}

export default { getAllBlockedSubmissions, createBlockedSubmission, removeBlockedSubmission, updateBlockedSubmissionComment, saveSubmissionComment, getSubmissionComments, deleteSubmissionComment }