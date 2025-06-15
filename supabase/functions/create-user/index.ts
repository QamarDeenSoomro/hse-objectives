import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.9';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests FIRST, before any logging!
  if (req.method === 'OPTIONS') {
    // Only log minimal info
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  // Now it's safe to log
  console.log('Create user function called with method:', req.method);
  
  try {
    // Get the authorization header to verify the requesting user is authenticated
    const authHeader = req.headers.get('Authorization');
    console.log('Authorization header present:', !!authHeader);
    
    if (!authHeader) {
      console.error('Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    console.log('Environment variables check:');
    console.log('SUPABASE_URL:', !!supabaseUrl);
    console.log('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceRoleKey);
    console.log('SUPABASE_ANON_KEY:', !!supabaseAnonKey);

    if (!supabaseUrl || !supabaseServiceRoleKey || !supabaseAnonKey) {
      console.error('Missing required environment variables');
      return new Response(
        JSON.stringify({ error: 'Server configuration error: Missing environment variables' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseServiceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Create regular client to verify the requesting user
    const supabaseAuth = createClient(
      supabaseUrl,
      supabaseAnonKey
    );

    // Get the user from the auth token
    const token = authHeader.replace('Bearer ', '');
    console.log('Attempting to verify user token');
    
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser(token);

    if (userError || !user) {
      console.error('Invalid auth token:', userError?.message);
      return new Response(
        JSON.stringify({ error: 'Invalid auth token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User verified successfully:', user.id);

    // Check if the requesting user is an admin
    console.log('Checking user role');
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError.message);
      return new Response(
        JSON.stringify({ error: 'Error checking user permissions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (profile?.role !== 'admin') {
      console.error('User is not admin, role:', profile?.role);
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Admin role verified');

    // Parse the request body
    const requestBody = await req.json();
    const { email, password, fullName, role } = requestBody;

    console.log('Request data:', { email, fullName, role, hasPassword: !!password });

    if (!email || !password) {
      console.error('Missing required fields');
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create the user using admin client
    console.log('Creating user with admin client');
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName || email
      }
    });

    if (authError) {
      console.error('Error creating auth user:', authError.message);
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User created successfully:', authData.user?.id);

    // Update the profile with role and full_name
    if (authData.user) {
      console.log('Updating user profile');
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({ 
          role: role || 'user',
          full_name: fullName || email
        })
        .eq('id', authData.user.id);

      if (profileError) {
        console.error('Error updating profile:', profileError.message);
        // Note: User was created but profile update failed
        return new Response(
          JSON.stringify({ 
            error: 'User created but profile update failed',
            user: authData.user 
          }),
          { status: 207, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log('User creation process completed successfully');

    return new Response(
      JSON.stringify({ 
        message: 'User created successfully',
        user: authData.user 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in create-user function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
