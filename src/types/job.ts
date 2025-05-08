
// Types for job-related data structures

export type Job = {
  id?: string;
  job_id?: string;
  user_id: string;
  prompt: string;
  status?: string;
  image_url?: string;
  model_url?: string;
  iterations?: number;
  created_at?: string;
  image_variations?: {
    id: number;
    url: string;
    selected: boolean;
  }[];
}
