const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Initialize database
const dbPath = path.join(__dirname, 'tourism_app_shared.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
    initDatabase();
  }
});

// Initialize database tables
function initDatabase() {
  db.serialize(() => {
    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON;');

    // Create accounts table
    db.run(`
      CREATE TABLE IF NOT EXISTS accounts (
        accid TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);

    // Create locations table
    db.run(`
      CREATE TABLE IF NOT EXISTS locations (
        locid TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        image_url TEXT,
        rating REAL DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);

    // Create visits_and_reviews table
    db.run(`
      CREATE TABLE IF NOT EXISTS visits_and_reviews (
        revid TEXT PRIMARY KEY,
        account_id TEXT NOT NULL,
        location_id TEXT NOT NULL,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        review_text TEXT,
        visited_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (account_id) REFERENCES accounts(accid),
        FOREIGN KEY (location_id) REFERENCES locations(locid)
      );
    `);

    // Create indexes
    db.run('CREATE INDEX IF NOT EXISTS idx_accounts_email ON accounts(email);');
    db.run('CREATE INDEX IF NOT EXISTS idx_visits_account ON visits_and_reviews(account_id);');
    db.run('CREATE INDEX IF NOT EXISTS idx_visits_location ON visits_and_reviews(location_id);');

    console.log('Database initialized');
  });
}

// Helper function to generate ID
function generateId(prefix) {
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${random}`;
}

// ==================== AUTH ENDPOINTS ====================

// Sign up
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, username } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    // Check if email exists
    db.get('SELECT email FROM accounts WHERE email = ?', [normalizedEmail], async (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (row) {
        return res.status(400).json({ error: 'Email already exists' });
      }

      // Hash password
      const salt = bcrypt.genSaltSync(10);
      const passwordHash = bcrypt.hashSync(password, salt);

      // Generate account ID
      const accid = generateId('T');

      // Insert account
      db.run(
        'INSERT INTO accounts (accid, username, email, password_hash) VALUES (?, ?, ?, ?)',
        [accid, username || normalizedEmail.split('@')[0], normalizedEmail, passwordHash],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to create account' });
          }

          // Get created account
          db.get(
            'SELECT accid, username, email, created_at FROM accounts WHERE accid = ?',
            [accid],
            (err, account) => {
              if (err || !account) {
                return res.status(500).json({ error: 'Failed to retrieve account' });
              }

              res.json({
                session: {
                  account: account,
                  email: account.email,
                },
                error: null,
              });
            }
          );
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sign in
app.post('/api/auth/signin', (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    db.get(
      'SELECT accid, username, email, password_hash, created_at FROM accounts WHERE email = ?',
      [normalizedEmail],
      (err, account) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        if (!account) {
          return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Verify password
        const passwordVerified = bcrypt.compareSync(password, account.password_hash);
        if (!passwordVerified) {
          return res.status(401).json({ error: 'Invalid email or password' });
        }

        res.json({
          session: {
            account: {
              accid: account.accid,
              username: account.username,
              email: account.email,
              created_at: account.created_at,
            },
            email: account.email,
          },
          error: null,
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== LOCATIONS ENDPOINTS ====================

// Get all locations
app.get('/api/locations', (req, res) => {
  db.all(
    'SELECT locid, name, description, latitude, longitude, image_url, rating, created_at FROM locations',
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(rows || []);
    }
  );
});

// Get location by ID
app.get('/api/locations/:id', (req, res) => {
  db.get(
    'SELECT locid, name, description, latitude, longitude, image_url, rating, created_at FROM locations WHERE locid = ?',
    [req.params.id],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!row) {
        return res.status(404).json({ error: 'Location not found' });
      }
      res.json(row);
    }
  );
});

// Create location
app.post('/api/locations', (req, res) => {
  try {
    const { name, description, latitude, longitude, image_url, rating } = req.body;
    const locid = generateId('L');

    db.run(
      'INSERT INTO locations (locid, name, description, latitude, longitude, image_url, rating) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [locid, name, description || null, latitude, longitude, image_url || null, rating || 0],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to create location' });
        }

        db.get(
          'SELECT locid, name, description, latitude, longitude, image_url, rating, created_at FROM locations WHERE locid = ?',
          [locid],
          (err, location) => {
            if (err || !location) {
              return res.status(500).json({ error: 'Failed to retrieve location' });
            }
            res.json(location);
          }
        );
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== REVIEWS ENDPOINTS ====================

// Get reviews for a location
app.get('/api/locations/:locationId/reviews', (req, res) => {
  db.all(
    `SELECT v.revid, v.account_id, v.location_id, v.rating, v.review_text, v.visited_at,
            a.username, a.email
     FROM visits_and_reviews v
     JOIN accounts a ON v.account_id = a.accid
     WHERE v.location_id = ?
     ORDER BY v.visited_at DESC`,
    [req.params.locationId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(rows || []);
    }
  );
});

// Get reviews by account
app.get('/api/accounts/:accountId/reviews', (req, res) => {
  db.all(
    `SELECT v.revid, v.account_id, v.location_id, v.rating, v.review_text, v.visited_at,
            l.name as location_name
     FROM visits_and_reviews v
     JOIN locations l ON v.location_id = l.locid
     WHERE v.account_id = ?
     ORDER BY v.visited_at DESC`,
    [req.params.accountId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(rows || []);
    }
  );
});

// Create review
app.post('/api/reviews', (req, res) => {
  try {
    const { account_id, location_id, rating, review_text } = req.body;
    const revid = generateId('R');

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    db.run(
      'INSERT INTO visits_and_reviews (revid, account_id, location_id, rating, review_text) VALUES (?, ?, ?, ?, ?)',
      [revid, account_id, location_id, rating, review_text || null],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to create review' });
        }

        db.get(
          'SELECT revid, account_id, location_id, rating, review_text, visited_at FROM visits_and_reviews WHERE revid = ?',
          [revid],
          (err, review) => {
            if (err || !review) {
              return res.status(500).json({ error: 'Failed to retrieve review' });
            }
            res.json(review);
          }
        );
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== SYNC ENDPOINTS ====================

// Sync account (upload from device to server)
app.post('/api/sync/account', (req, res) => {
  // Similar to signup, but handles existing accounts
  const { accid, username, email, password_hash, created_at } = req.body;

  db.run(
    'INSERT OR REPLACE INTO accounts (accid, username, email, password_hash, created_at) VALUES (?, ?, ?, ?, ?)',
    [accid, username, email, password_hash, created_at],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Sync failed' });
      }
      res.json({ success: true });
    }
  );
});

// Sync location
app.post('/api/sync/location', (req, res) => {
  const { locid, name, description, latitude, longitude, image_url, rating, created_at } = req.body;

  db.run(
    'INSERT OR REPLACE INTO locations (locid, name, description, latitude, longitude, image_url, rating, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [locid, name, description, latitude, longitude, image_url, rating, created_at],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Sync failed' });
      }
      res.json({ success: true });
    }
  );
});

// Sync review
app.post('/api/sync/review', (req, res) => {
  const { revid, account_id, location_id, rating, review_text, visited_at } = req.body;

  db.run(
    'INSERT OR REPLACE INTO visits_and_reviews (revid, account_id, location_id, rating, review_text, visited_at) VALUES (?, ?, ?, ?, ?, ?)',
    [revid, account_id, location_id, rating, review_text, visited_at],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Sync failed' });
      }
      res.json({ success: true });
    }
  );
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API endpoints available at http://localhost:${PORT}/api`);
});

