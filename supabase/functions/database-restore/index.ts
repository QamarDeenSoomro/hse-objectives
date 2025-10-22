import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { initializeApp, cert, getApps } from 'https://esm.sh/firebase-admin@12.0.0/app';
import { getFirestore } from 'https://esm.sh/firebase-admin@12.0.0/firestore';

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
    const { backup, platform = 'supabase' } = await req.json();
    
    if (!backup || !backup.tables) {
      throw new Error('Invalid backup file format');
    }

    console.log('Starting database restore...');
    console.log(`Platform: ${platform}`);
    console.log(`Backup version: ${backup.version}`);
    console.log(`Backup timestamp: ${backup.timestamp}`);

    // Route to appropriate restore function based on platform
    if (platform === 'firebase') {
      return await restoreToFirebase(backup, user);
    } else {
      return await restoreToSupabase(backup, user, supabase);
    }
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

async function restoreToFirebase(backup: any, user: any) {
  try {
    console.log('Initializing Firebase Admin...');
    
    // Get Firebase credentials from environment
    const firebaseCredentials = Deno.env.get('FIREBASE_SERVICE_ACCOUNT');
    if (!firebaseCredentials) {
      throw new Error('Firebase credentials not configured. Please add FIREBASE_SERVICE_ACCOUNT secret.');
    }

    const serviceAccount = JSON.parse(firebaseCredentials);
    
    // Initialize Firebase Admin if not already initialized
    if (getApps().length === 0) {
      initializeApp({
        credential: cert(serviceAccount)
      });
    }
    
    const db = getFirestore();
    const restoreResults: Record<string, any> = {};

    // Map SQL tables to Firestore collections
    const tableToCollection = {
      'profiles': 'users',
      'objectives': 'objectives',
      'objective_updates': 'updates',
      'daily_work': 'dailyWork',
      'action_items': 'actionItems',
      'action_item_closures': 'actionItemClosures',
      'action_item_verifications': 'actionItemVerifications',
      'system_settings': 'systemSettings',
      'component_permissions': 'permissions'
    };

    for (const [table, collection] of Object.entries(tableToCollection)) {
      if (!backup.tables[table]) {
        console.log(`No data for table: ${table}, skipping`);
        continue;
      }

      const rows = backup.tables[table];
      console.log(`Restoring ${rows.length} documents to ${collection}`);

      try {
        // Delete existing documents
        const snapshot = await db.collection(collection).get();
        const batch = db.batch();
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();

        // Insert backup data in batches (Firestore limit is 500 per batch)
        for (let i = 0; i < rows.length; i += 500) {
          const batchData = rows.slice(i, i + 500);
          const writeBatch = db.batch();
          
          batchData.forEach((row: any) => {
            const docRef = db.collection(collection).doc(row.id);
            writeBatch.set(docRef, row);
          });
          
          await writeBatch.commit();
        }

        restoreResults[table] = {
          success: true,
          documents_restored: rows.length,
          collection: collection
        };
        console.log(`Successfully restored ${rows.length} documents to ${collection}`);
      } catch (error) {
        restoreResults[table] = {
          success: false,
          error: error.message,
          collection: collection
        };
        console.error(`Failed to restore ${table}:`, error);
      }
    }

    const successCount = Object.values(restoreResults).filter((r: any) => r.success).length;
    const totalCount = Object.keys(restoreResults).length;

    console.log(`Firebase restore completed: ${successCount}/${totalCount} collections restored`);

    return new Response(
      JSON.stringify({ 
        success: true,
        platform: 'firebase',
        message: `Firebase restored: ${successCount}/${totalCount} collections`,
        results: restoreResults,
        restored_by: user.email,
        restored_at: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Firebase restore error:', error);
    throw error;
  }
}

async function restoreToSupabase(backup: any, user: any, supabase: any) {
  try {

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

    console.log(`Supabase restore completed: ${successCount}/${totalCount} tables restored successfully`);

    return new Response(
      JSON.stringify({ 
        success: true,
        platform: 'supabase',
        message: `Supabase restored: ${successCount}/${totalCount} tables`,
        results: restoreResults,
        restored_by: user.email,
        restored_at: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Supabase restore error:', error);
    throw error;
  }
}
