import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get total patterns
    const { count: totalCount } = await supabase
      .from('patterns')
      .select('*', { count: 'exact', head: true });

    // Get unarchived patterns
    const { count: unarchivedCount } = await supabase
      .from('patterns')
      .select('*', { count: 'exact', head: true })
      .is('batch_id', null);

    // Get latest batch
    const { data: latestBatch } = await supabase
      .from('batches')
      .select('*')
      .order('id', { ascending: false })
      .limit(1)
      .single();

    // Get recent batches
    const { data: recentBatches } = await supabase
      .from('batches')
      .select('*')
      .order('id', { ascending: false })
      .limit(10);

    res.status(200).json({
      total_patterns: totalCount,
      unarchived: unarchivedCount,
      latest_batch: latestBatch,
      recent_batches: recentBatches,
      ready_to_post: unarchivedCount >= 500
    });

  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: error.message });
  }
}
