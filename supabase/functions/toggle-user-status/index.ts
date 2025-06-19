import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role key for admin operations
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

    // Get the authorization header to verify the requesting user is authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Verify the user is authenticated and get their info
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Invalid auth token');
    }

    // Check if the user is an admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      throw new Error('Error fetching user profile');
    }

    if (profile?.role !== 'admin' && profile?.role !== 'superadmin') {
      throw new Error('Insufficient permissions');
    }

    // Parse the request body
    const { userId, disable } = await req.json();

    if (!userId) {
      throw new Error('User ID is required');
    }

    // Check if the target user is a superadmin (only superadmins can disable other superadmins)
    const { data: targetProfile, error: targetProfileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (targetProfileError) {
      throw new Error('Error fetching target user profile');
    }

    if (targetProfile?.role === 'superadmin' && profile?.role !== 'superadmin') {
      throw new Error('Only superadmins can disable other superadmins');
    }

    // Set the ban duration (null for enable, 100 years for disable)
    const banDuration = disable ? '876000h' : 'none';

    // Update the user's ban status using the admin API
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { ban_duration: banDuration }
    );

    if (updateError) {
      throw updateError;
    }

    // Also update the banned_until field in the profiles table for UI consistency
    const bannedUntil = disable 
      ? new Date(Date.now() + 876000 * 60 * 60 * 1000).toISOString() 
      : null;

    const { error: profileUpdateError } = await supabaseAdmin
      .from('profiles')
      .update({ banned_until: bannedUntil })
      .eq('id', userId);

    if (profileUpdateError) {
      console.warn('Profile update error:', profileUpdateError);
      // Continue even if this fails, as the auth ban is the important part
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `User ${disable ? 'disabled' : 'enabled'} successfully`,
        banned_until: bannedUntil
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in toggle-user-status function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});