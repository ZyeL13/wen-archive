export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action } = req.body;

  // Simple auth (ganti dengan proper auth nanti)
  const authToken = req.headers.authorization;
  if (authToken !== `Bearer ${process.env.ADMIN_TOKEN}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    if (action === 'archive') {
      // Trigger archive via webhook atau queue
      // Untuk simple version, bisa return instruction
      res.status(200).json({ 
        message: 'Archive triggered',
        instruction: 'Run: python archiver/scheduler.py on server'
      });

    } else if (action === 'post') {
      // Trigger post
      res.status(200).json({ 
        message: 'Post triggered',
        instruction: 'Run: python archiver/scheduler.py --post on server'
      });

    } else {
      res.status(400).json({ error: 'Invalid action' });
    }

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
