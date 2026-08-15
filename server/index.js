import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors());
app.use(express.json());

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let supabase;
if (supabaseUrl && supabaseServiceRoleKey) {
  supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  console.log('Supabase service role client initialized successfully.');
} else {
  console.warn('Supabase URL or Service Role Key missing from environment. Server-side database actions may fail.');
}

// Basic Health Check Route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Example route: Get positions (jobs) through backend
app.get('/api/jobs', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase client is not initialized on the server.' });
    }
    const { data, error } = await supabase
      .from('positions')
      .select('*, companies(company_name)')
      .eq('status', 'open');

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve static assets in production
const clientDistPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  console.log(`Serving static files from: ${clientDistPath}`);
  app.use(express.static(clientDistPath));
  
  // All non-API requests should be directed to the client index.html
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
} else {
  console.warn(`Client dist directory not found at: ${clientDistPath}. Frontend static files will not be served.`);
}

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

