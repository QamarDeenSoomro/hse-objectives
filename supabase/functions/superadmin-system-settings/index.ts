import { createClient } from 'npm:@supabase/supabase-js@2.49.9';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Create client for user authentication (using anon key)
    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Create admin client for database operations (using service role key)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify the user is authenticated and get their info using the auth client
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid token');
    }

    // Check if the user is a superadmin using the admin client
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'superadmin') {
      throw new Error('Unauthorized: Super admin access required');
    }

    let result;

    if (req.method === 'GET') {
      // Get all system settings
      const { data: settings, error: settingsError } = await supabaseAdmin
        .from('system_settings')
        .select('*')
        .order('setting_key');

      if (settingsError) throw settingsError;

      // Get all component permissions
      const { data: permissions, error: permissionsError } = await supabaseAdmin
        .from('component_permissions')
        .select('*')
        .order('component_name, permission_type');

      if (permissionsError) throw permissionsError;

      result = { settings, permissions };

    } else if (req.method === 'POST' || req.method === 'PUT') {
      const { type, data } = await req.json();

      if (type === 'system_setting') {
        // Update system setting
        const { setting_key, setting_value, description } = data;

        const { error: updateError } = await supabaseAdmin
          .from('system_settings')
          .upsert({
            setting_key,
            setting_value,
            description,
            updated_by: user.id,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'setting_key'
          });

        if (updateError) throw updateError;

        result = { success: true };

      } else if (type === 'component_permission') {
        // Update component permission
        const { id, component_name, permission_type, role_required, is_enabled, valid_until } = data;

        if (id) {
          // Update existing permission
          const { error: updateError } = await supabaseAdmin
            .from('component_permissions')
            .update({
              is_enabled,
              valid_until,
              updated_by: user.id,
              updated_at: new Date().toISOString()
            })
            .eq('id', id);

          if (updateError) throw updateError;
        } else {
          // Create new permission
          const { error: insertError } = await supabaseAdmin
            .from('component_permissions')
            .insert({
              component_name,
              permission_type,
              role_required,
              is_enabled,
              valid_until,
              created_by: user.id,
              updated_by: user.id
            });

          if (insertError) throw insertError;
        }

        result = { success: true };

      } else {
        throw new Error('Invalid data type');
      }
    }

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );

  } catch (error) {
    console.error('Error in superadmin-system-settings:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    );
  }
});