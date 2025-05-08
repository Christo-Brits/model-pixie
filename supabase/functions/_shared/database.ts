
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.0";
import { getEdgeFunctionConfig } from "./config.ts";

/**
 * Helper function to check if a column exists in a table
 * Used to safely handle schema variations between environments
 */
export async function columnExists(
  supabase: ReturnType<typeof createClient>,
  table: string,
  column: string
): Promise<boolean> {
  try {
    // Query the information schema to check if the column exists
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', table)
      .eq('column_name', column)
      .maybeSingle();

    if (error) {
      console.error(`Error checking for column ${column} in table ${table}:`, error);
      return false;
    }

    return !!data;
  } catch (err) {
    console.error(`Exception checking for column ${column} in table ${table}:`, err);
    return false;
  }
}

/**
 * Create a database client using configuration from the environment
 */
export function createDatabaseClient() {
  const config = getEdgeFunctionConfig();
  return createClient(config.supabaseUrl, config.supabaseServiceKey);
}
