import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    }

    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseServiceKey,
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

    // Verify the user is authenticated and get their info
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid token');
    }

    // Check if the user is an admin or superadmin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !['admin', 'superadmin'].includes(profile?.role)) {
      throw new Error('Unauthorized: Admin access required');
    }

    // Get the request body
    const { userId, action } = await req.json();

    if (!userId || !action) {
      throw new Error('Missing userId or action');
    }

    let result;

    if (action === 'enable') {
      // Enable user by removing ban
      const { error: enableError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { ban_duration: 'none' }
      );
      if (enableError) throw enableError;

      // Update profile to remove banned_until
      const { error: profileUpdateError } = await supabaseAdmin
        .from('profiles')
        .update({ banned_until: null })
        .eq('id', userId);

      if (profileUpdateError) {
        console.warn('Could not update profile banned_until:', profileUpdateError);
      }

      result = { success: true, message: 'User enabled successfully' };

    } else if (action === 'disable') {
      // Disable user by setting a long ban duration
      const { error: disableError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { ban_duration: '876000h' } // ~100 years
      );
      if (disableError) throw disableError;

      // Update profile to set banned_until
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 100);
      
      const { error: profileUpdateError } = await supabaseAdmin
        .from('profiles')
        .update({ banned_until: futureDate.toISOString() })
        .eq('id', userId);

      if (profileUpdateError) {
        console.warn('Could not update profile banned_until:', profileUpdateError);
      }

      result = { success: true, message: 'User disabled successfully' };

    } else {
      throw new Error('Invalid action. Use "enable" or "disable"');
    }

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );

  } catch (error) {
    console.error('Error in toggle-user-status:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    );
  }
});