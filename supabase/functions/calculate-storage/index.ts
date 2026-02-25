import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StorageObject {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: {
    size: number;
    mimetype: string;
    cacheControl: string;
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Verify user is admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Access denied. Admin privileges required.' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get all users
    const { data: users, error: usersError } = await supabaseClient
      .from('profiles')
      .select('id, username');

    if (usersError) {
      throw usersError;
    }

    // Calculate file storage for each user
    const storageResults = [];

    for (const user of users || []) {
      let totalSize = 0;

      // List all storage buckets
      const { data: buckets, error: bucketsError } = await supabaseClient
        .storage
        .listBuckets();

      if (!bucketsError && buckets) {
        for (const bucket of buckets) {
          // List files in bucket for this user
          const { data: files, error: filesError } = await supabaseClient
            .storage
            .from(bucket.name)
            .list(user.id, {
              limit: 1000,
              sortBy: { column: 'created_at', order: 'desc' },
            });

          if (!filesError && files) {
            for (const file of files as unknown as StorageObject[]) {
              if (file.metadata?.size) {
                totalSize += file.metadata.size;
              }
            }
          }
        }
      }

      // Update storage usage in database
      const { error: updateError } = await supabaseClient
        .rpc('update_user_storage_usage', {
          target_user_id: user.id,
          file_bytes: totalSize,
        });

      if (updateError) {
        console.error(`Error updating storage for user ${user.id}:`, updateError);
      }

      storageResults.push({
        user_id: user.id,
        username: user.username,
        file_storage_bytes: totalSize,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Storage calculation completed',
        results: storageResults,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error calculating storage:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});