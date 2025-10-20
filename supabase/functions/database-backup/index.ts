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
    console.log('Database backup request received');

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

    console.log('Backing up database tables...');

    // Backup all tables
    const tables = [
      'profiles',
      'objectives',
      'objective_updates',
      'daily_work',
      'action_items',
      'action_item_closures',
      'action_item_verifications',
      'system_settings',
      'component_permissions'
    ];

    const backupData: Record<string, any[]> = {};

    for (const table of tables) {
      console.log(`Backing up table: ${table}`);
      const { data, error } = await supabase
        .from(table)
        .select('*');

      if (error) {
        console.error(`Error backing up ${table}:`, error);
        throw new Error(`Failed to backup ${table}: ${error.message}`);
      }

      backupData[table] = data || [];
      console.log(`Backed up ${data?.length || 0} rows from ${table}`);
    }

    const backup = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      tables: backupData,
      metadata: {
        backup_by: user.id,
        backup_by_email: user.email,
        total_tables: tables.length,
        total_rows: Object.values(backupData).reduce((sum, rows) => sum + rows.length, 0)
      }
    };

    console.log('Database backup completed successfully');

    return new Response(
      JSON.stringify(backup),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="database-backup-${new Date().toISOString().split('T')[0]}.json"`
        } 
      }
    );
  } catch (error) {
    console.error('Database backup error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to create database backup',
        details: error.toString()
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
