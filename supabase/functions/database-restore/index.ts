import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Database restore request received');

    // Create Supabase admin client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user is superadmin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if user is superadmin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'superadmin') {
      throw new Error('Super admin access required');
    }

    // Parse backup data
    const { backup } = await req.json();
    
    if (!backup || !backup.tables) {
      throw new Error('Invalid backup file format');
    }

    console.log('Starting database restore...');
    console.log(`Backup version: ${backup.version}`);
    console.log(`Backup timestamp: ${backup.timestamp}`);

    const restoreResults: Record<string, any> = {};

    // Restore tables in order (respecting foreign key dependencies)
    const restoreOrder = [
      'profiles',
      'system_settings',
      'component_permissions',
      'objectives',
      'objective_updates',
      'daily_work',
      'action_items',
      'action_item_closures',
      'action_item_verifications'
    ];

    for (const table of restoreOrder) {
      if (!backup.tables[table]) {
        console.log(`No data for table: ${table}, skipping`);
        continue;
      }

      const rows = backup.tables[table];
      console.log(`Restoring ${rows.length} rows to ${table}`);

      try {
        // Delete existing data (be careful!)
        const { error: deleteError } = await supabase
          .from(table)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

        if (deleteError) {
          console.error(`Error clearing ${table}:`, deleteError);
          throw new Error(`Failed to clear ${table}: ${deleteError.message}`);
        }

        // Insert backup data
        if (rows.length > 0) {
          const { error: insertError } = await supabase
            .from(table)
            .insert(rows);

          if (insertError) {
            console.error(`Error restoring ${table}:`, insertError);
            throw new Error(`Failed to restore ${table}: ${insertError.message}`);
          }
        }

        restoreResults[table] = {
          success: true,
          rows_restored: rows.length
        };
        console.log(`Successfully restored ${rows.length} rows to ${table}`);
      } catch (error) {
        restoreResults[table] = {
          success: false,
          error: error.message
        };
        console.error(`Failed to restore ${table}:`, error);
        // Continue with other tables even if one fails
      }
    }

    const successCount = Object.values(restoreResults).filter((r: any) => r.success).length;
    const totalCount = Object.keys(restoreResults).length;

    console.log(`Database restore completed: ${successCount}/${totalCount} tables restored successfully`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Database restored: ${successCount}/${totalCount} tables`,
        results: restoreResults,
        restored_by: user.email,
        restored_at: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Database restore error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to restore database',
        details: error.toString()
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
