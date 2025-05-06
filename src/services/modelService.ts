
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

export interface Job {
  id: string;
  user_id: string;
  prompt: string;
  image_url?: string | null;
  model_url?: string | null;
  status?: string | null;
  iterations?: number | null;
  job_id?: string | null;
  created_at: string;
}

export interface Feedback {
  id: string;
  job_id: string;
  rating?: number | null;
  comment?: string | null;
  created_at: string;
}

export const modelService = {
  // Jobs CRUD operations
  async createJob(prompt: string): Promise<Job | null> {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .insert({ prompt, status: 'pending' })
        .select()
        .single();

      if (error) {
        toast({
          title: "Error creating job",
          description: error.message,
          variant: "destructive",
        });
        return null;
      }
      return data;
    } catch (error) {
      console.error("Error creating job:", error);
      return null;
    }
  },

  async getJobs(): Promise<Job[]> {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          title: "Error fetching jobs",
          description: error.message,
          variant: "destructive",
        });
        return [];
      }
      return data || [];
    } catch (error) {
      console.error("Error fetching jobs:", error);
      return [];
    }
  },

  async getJob(id: string): Promise<Job | null> {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        toast({
          title: "Error fetching job",
          description: error.message,
          variant: "destructive",
        });
        return null;
      }
      return data;
    } catch (error) {
      console.error(`Error fetching job ${id}:`, error);
      return null;
    }
  },

  async updateJob(id: string, updates: Partial<Job>): Promise<Job | null> {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        toast({
          title: "Error updating job",
          description: error.message,
          variant: "destructive",
        });
        return null;
      }
      return data;
    } catch (error) {
      console.error(`Error updating job ${id}:`, error);
      return null;
    }
  },

  async deleteJob(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', id);

      if (error) {
        toast({
          title: "Error deleting job",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }
      return true;
    } catch (error) {
      console.error(`Error deleting job ${id}:`, error);
      return false;
    }
  },

  // Feedback CRUD operations
  async createFeedback(jobId: string, rating?: number, comment?: string): Promise<Feedback | null> {
    try {
      const { data, error } = await supabase
        .from('feedback')
        .insert({
          job_id: jobId,
          rating,
          comment
        })
        .select()
        .single();

      if (error) {
        toast({
          title: "Error submitting feedback",
          description: error.message,
          variant: "destructive",
        });
        return null;
      }
      return data;
    } catch (error) {
      console.error("Error submitting feedback:", error);
      return null;
    }
  },

  async getFeedbackForJob(jobId: string): Promise<Feedback | null> {
    try {
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .eq('job_id', jobId)
        .maybeSingle();

      if (error) {
        toast({
          title: "Error fetching feedback",
          description: error.message,
          variant: "destructive",
        });
        return null;
      }
      return data;
    } catch (error) {
      console.error(`Error fetching feedback for job ${jobId}:`, error);
      return null;
    }
  },

  async updateFeedback(id: string, updates: Partial<Feedback>): Promise<Feedback | null> {
    try {
      const { data, error } = await supabase
        .from('feedback')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        toast({
          title: "Error updating feedback",
          description: error.message,
          variant: "destructive",
        });
        return null;
      }
      return data;
    } catch (error) {
      console.error(`Error updating feedback ${id}:`, error);
      return null;
    }
  },

  async deleteFeedback(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('feedback')
        .delete()
        .eq('id', id);

      if (error) {
        toast({
          title: "Error deleting feedback",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }
      return true;
    } catch (error) {
      console.error(`Error deleting feedback ${id}:`, error);
      return false;
    }
  }
};
