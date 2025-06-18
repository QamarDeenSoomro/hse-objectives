import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

    // Verify the user is authenticated and get their info
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid token');
    }

    // Check if the user is a superadmin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'superadmin') {
      throw new Error('Unauthorized: Super admin access required');
    }

    // Get the request body
    const { action, userId, userData } = await req.json();

    let result;

    switch (action) {
      case 'create':
        // Create new user
        const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: userData.email,
          password: userData.password,
          email_confirm: true,
          user_metadata: {
            full_name: userData.fullName || userData.email
          }
        });

        if (createError) throw createError;

        // Update profile with role and full_name
        if (authData.user) {
          const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .update({ 
              role: userData.role || 'user',
              full_name: userData.fullName || userData.email
            })
            .eq('id', authData.user.id);

          if (profileError) {
            console.error('Error updating profile:', profileError);
          }
        }

        result = { user: authData.user };
        break;

      case 'update':
        // Update user data
        const updateData: any = {};
        if (userData.email) updateData.email = userData.email;
        if (userData.password) updateData.password = userData.password;

        if (Object.keys(updateData).length > 0) {
          const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(
            userId,
            updateData
          );
          if (updateAuthError) throw updateAuthError;
        }

        // Update profile
        const profileUpdateData: any = {};
        if (userData.fullName !== undefined) profileUpdateData.full_name = userData.fullName;
        if (userData.role !== undefined) profileUpdateData.role = userData.role;

        if (Object.keys(profileUpdateData).length > 0) {
          const { error: updateProfileError } = await supabaseAdmin
            .from('profiles')
            .update(profileUpdateData)
            .eq('id', userId);

          if (updateProfileError) throw updateProfileError;
        }

        result = { success: true };
        break;

      case 'delete':
        // Delete user
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (deleteError) throw deleteError;

        result = { success: true };
        break;

      case 'enable':
      case 'disable':
        // Enable/disable user
        const { error: toggleError } = await supabaseAdmin.auth.admin.updateUserById(
          userId,
          { ban_duration: action === 'disable' ? '876000h' : 'none' } // ~100 years for disable
        );
        if (toggleError) throw toggleError;

        result = { success: true };
        break;

      default:
        throw new Error('Invalid action');
    }

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );

  } catch (error) {
    console.error('Error in superadmin-manage-users:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    );
  }
});