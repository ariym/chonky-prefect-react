const PREFECT_BASE_URL = import.meta.env.VITE_PREFECT_API_URL;

export interface FlowRun {
  id: string;
  name: string;
  status?: string;
  state_type?: string;
  state_name?: string;
  flow_id?: string;
  created?: string;
  updated?: string;
  start_time?: string;
  end_time?: string;
}

// List flow runs from Prefect API
// Flow runs represent flow executions with status information
export async function listFlowRuns(): Promise<FlowRun[]> {
  const url = `${PREFECT_BASE_URL}/flow_runs/filter`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      limit: 100,
      offset: 0,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch flow runs: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  // Debug: log the response to see the structure
  console.log('Prefect API response:', data);

  // Prefect API returns an object with a 'results' array, or might be an array directly
  if (Array.isArray(data)) {
    return data;
  }
  return data.results || [];
}

