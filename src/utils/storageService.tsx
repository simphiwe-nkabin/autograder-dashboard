import type { BlockedSubmission } from "../types/storageTypes";
import type { AutogradeWorkerLog } from "../types/storageTypes";

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
 
// load all autograde worker logs

export async function getAutogradeWorkerLogs(): Promise<AutogradeWorkerLog[]> {
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_BASEURL}/autograde_worker_log?select=*`,
    {
      method: 'GET',
      headers: {
        apikey: import.meta.env.VITE_SUPABASE_APIKEY as string,
      
        // Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_APIKEY}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data as AutogradeWorkerLog[];
}




export default { getAllBlockedSubmissions, createBlockedSubmission, removeBlockedSubmission, updateBlockedSubmissionComment, getAutogradeWorkerLogs }