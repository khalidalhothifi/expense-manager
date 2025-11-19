
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '123456',
    database: process.env.DB_NAME || 'expense_manager_db',
};

// Encryption settings for SMTP password
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '12345678901234567890123456789012'; // 32 chars
const IV_LENGTH = 16;

const app = express();
const port = 5000;

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

const pool = new Pool(dbConfig);

// --- Constants for Defaults ---
const DEFAULT_SMTP = {
    server: 'smtp.example.com',
    port: 587,
    user: 'noreply@example.com',
    pass: 'password' 
};

const DEFAULT_TEMPLATES = {
    'New Invoice Submitted': {
        en: {
            subject: 'New Expense Submitted: {vendor}',
            body: 'A new expense from {vendor} for ${total} has been submitted by {userName} and is awaiting your approval.',
        },
        ar: {
            "subject": "تم تقديم مصروف جديد: {vendor}",
            "body": "تم تقديم مصروف جديد من {vendor} بمبلغ ${total} بواسطة {userName} وهو بانتظار موافقتك."
        }
    },
    'Expense Approved': {
        en: {
            subject: 'Expense Approved: {vendor}',
            body: 'Your expense from {vendor} for ${total} has been approved.',
        },
        ar: {
            "subject": "تمت الموافقة على المصروف: {vendor}",
            "body": "تمت الموافقة على مصروفك من {vendor} بمبلغ ${total}."
        }
    },
    'Expense Rejected': {
        en: {
            subject: 'Expense Rejected: {vendor}',
            body: 'Your expense from {vendor} for ${total} has been rejected. Please review and contact your manager.',
        },
        ar: {
            "subject": "تم رفض المصروف: {vendor}",
            "body": "تم رفض مصروفك من {vendor} بمبلغ ${total}. يرجى المراجعة والتواصل مع مديرك."
        }
    },
    'Budget Threshold Warning': {
        en: {
            subject: 'Budget Warning: {responsibilityName}',
            body: 'The budget for "{responsibilityName}" has reached {usagePercentage}% of its limit.',
        },
        ar: {
            "subject": "تحذير الميزانية: {responsibilityName}",
            "body": "وصلت ميزانية \"{responsibilityName}\" إلى {usagePercentage}% من حدها."
        }
    },
    'Responsibility Assigned/Modified': {
        en: {
            subject: 'New Financial Responsibility Assigned',
            body: 'You have been assigned a new financial responsibility: "{responsibilityName}" with a budget of ${budget}.',
        },
        ar: {
            "subject": "تم تعيين مسؤولية مالية جديدة",
            "body": "تم تعيين مسؤولية مالية جديدة لك: \"{responsibilityName}\" بميزانية قدرها ${budget}."
        }
    }
};

// --- Encryption Helpers ---

function encrypt(text) {
    if (!text) return text;
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
    if (!text) return text;
    const textParts = text.split(':');
    if (textParts.length < 2) return text; // Not encrypted or invalid
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

// --- Helpers ---

const toCamelCase = (row) => {
    if (!row) return null;
    const newRow = {};
    for (const key in row) {
        const newKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
        let value = row[key];
        if (['total', 'tax', 'budget'].includes(newKey) && value !== null) {
            const num = parseFloat(value);
            if (!isNaN(num)) {
                value = num;
            }
        }
        // Ensure attachments is always an array if it exists
        if (newKey === 'attachment' && value && !Array.isArray(value)) {
            value = [value];
        }
        // Map 'attachment' DB column to 'attachments' frontend prop for backward compatibility
        if (newKey === 'attachment') {
            newRow['attachments'] = Array.isArray(value) ? value : (value ? [value] : []);
        } else {
             newRow[newKey] = value;
        }
    }
    if (newRow.passwordHash) delete newRow.passwordHash;
    if (newRow.isDeleted !== undefined) delete newRow.isDeleted;
    // Cleanup temp attachment field
    delete newRow.attachment;
    return newRow;
};

const formatDateForHistory = () => {
    const date = new Date();
    const pad = (n) => n.toString().padStart(2, '0');
    return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

// --- Settings Routes ---

app.get('/api/settings', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM system_settings');
        let settings = {
            smtp: null,
            templates: null
        };

        result.rows.forEach(row => {
            if (row.key === 'smtp') settings.smtp = row.value;
            if (row.key === 'templates') settings.templates = row.value;
        });

        const client = await pool.connect();
        try {
            // Seed SMTP if missing
            if (!settings.smtp) {
                const smtpToSave = { ...DEFAULT_SMTP };
                // Encrypt default password
                smtpToSave.pass = encrypt(smtpToSave.pass); 
                await client.query(
                    'INSERT INTO system_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING',
                    ['smtp', JSON.stringify(smtpToSave)]
                );
                settings.smtp = DEFAULT_SMTP; // Return decrypted/plain for UI
            } else {
                 // Decrypt existing
                 if (settings.smtp.pass) {
                    settings.smtp.pass = decrypt(settings.smtp.pass);
                }
            }

            // Seed Templates if missing
            if (!settings.templates) {
                await client.query(
                    'INSERT INTO system_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING',
                    ['templates', JSON.stringify(DEFAULT_TEMPLATES)]
                );
                settings.templates = DEFAULT_TEMPLATES;
            }
        } catch(seedErr) {
            console.error("Error seeding defaults:", seedErr);
        } finally {
            client.release();
        }

        res.json(settings);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

app.post('/api/settings', async (req, res) => {
    const { smtp, templates } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        if (smtp) {
            // Encrypt password before saving
            const smtpToSave = { ...smtp };
            if (smtpToSave.pass) {
                smtpToSave.pass = encrypt(smtpToSave.pass);
            }
            await client.query(
                'INSERT INTO system_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2',
                ['smtp', JSON.stringify(smtpToSave)]
            );
        }

        if (templates) {
            await client.query(
                'INSERT INTO system_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2',
                ['templates', JSON.stringify(templates)]
            );
        }

        await client.query('COMMIT');
        res.json({ success: true });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).send('Server error');
    } finally {
        client.release();
    }
});

// --- Email Sending ---

app.post('/api/send-email', async (req, res) => {
    const { to, subject, text, html } = req.body;
    try {
        // Fetch SMTP settings from DB
        const resSettings = await pool.query("SELECT value FROM system_settings WHERE key = 'smtp'");
        let transporterConfig;

        if (resSettings.rows.length > 0) {
            const smtp = resSettings.rows[0].value;
            transporterConfig = {
                host: smtp.server,
                port: parseInt(smtp.port),
                secure: parseInt(smtp.port) === 465,
                auth: {
                    user: smtp.user,
                    pass: decrypt(smtp.pass)
                }
            };
        } else {
             // Fallback to env or default
            transporterConfig = {
                host: process.env.SMTP_HOST || 'smtp.ethereal.email',
                port: process.env.SMTP_PORT || 587,
                secure: false,
                auth: {
                    user: process.env.SMTP_USER || 'user',
                    pass: process.env.SMTP_PASS || 'pass'
                }
            };
        }

        const transporter = nodemailer.createTransport(transporterConfig);

        const info = await transporter.sendMail({
            from: `"ExpenSavvy System" <${transporterConfig.auth.user}>`,
            to,
            subject,
            text,
            html
        });
        console.log("Message sent: %s", info.messageId);
        res.json({ success: true, messageId: info.messageId });
    } catch (error) {
        console.error("Error sending email:", error);
        res.status(500).json({ success: false, error: error.message }); 
    }
});


// --- CRUD Routes (Soft Deletes) ---

// Login
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT id, name, email, role FROM users WHERE email = $1 AND password_hash = $2 AND is_deleted = false', [email, password]);
        if (result.rows.length > 0) {
            res.json(toCamelCase(result.rows[0]));
        } else {
            res.status(401).send('Invalid credentials');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// Users
app.get('/api/users', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name, email, role FROM users WHERE is_deleted = false ORDER BY name ASC');
        res.json(result.rows.map(toCamelCase));
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

app.post('/api/users', async (req, res) => {
    const { name, email, role, password } = req.body;
    const id = `user${Date.now()}`;
    try {
        const result = await pool.query(
            'INSERT INTO users (id, name, email, role, password_hash) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role',
            [id, name, email, role, password]
        );
        res.json(toCamelCase(result.rows[0]));
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

app.put('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    const { name, email, role } = req.body;
    try {
        const result = await pool.query(
            'UPDATE users SET name = $1, email = $2, role = $3 WHERE id = $4 RETURNING id, name, email, role',
            [name, email, role, id]
        );
        res.json(toCamelCase(result.rows[0]));
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

app.delete('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('UPDATE users SET is_deleted = true WHERE id = $1', [id]);
        res.sendStatus(204);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// Reset Password
app.post('/api/users/:id/reset-password', async (req, res) => {
    const { id } = req.params;
    try {
        const userRes = await pool.query('SELECT email, name FROM users WHERE id = $1 AND is_deleted = false', [id]);
        if (userRes.rows.length === 0) return res.status(404).send('User not found');
        const user = userRes.rows[0];
        const resetToken = Math.random().toString(36).substring(7);
        const resetLink = `http://localhost:5173/reset-password?token=${resetToken}`;
        
        res.json({ success: true, message: 'Reset link sent to email' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// Groups
app.get('/api/groups', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM groups WHERE is_deleted = false ORDER BY name ASC');
        res.json(result.rows.map(toCamelCase));
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

app.put('/api/groups/:id', async (req, res) => {
    const { id } = req.params;
    const { name, memberIds } = req.body;
    try {
        const result = await pool.query(
            'UPDATE groups SET name = $1, member_ids = $2 WHERE id = $3 RETURNING *',
            [name, JSON.stringify(memberIds), id]
        );
        res.json(toCamelCase(result.rows[0]));
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// Vendors
app.get('/api/vendors', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name FROM vendors WHERE is_deleted = false ORDER BY name ASC');
        res.json(result.rows.map(toCamelCase));
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

app.post('/api/vendors', async (req, res) => {
    const { name } = req.body;
    const id = `vendor${Date.now()}`;
    try {
        const result = await pool.query('INSERT INTO vendors (id, name) VALUES ($1, $2) RETURNING id, name', [id, name]);
        res.json(toCamelCase(result.rows[0]));
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// Responsibilities
app.get('/api/responsibilities', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM financial_responsibilities WHERE is_deleted = false ORDER BY name ASC');
        res.json(result.rows.map(toCamelCase));
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

app.post('/api/responsibilities', async (req, res) => {
    const { name, budget, model, assignee, distributedAllocations, creatorName } = req.body;
    const id = `resp${Date.now()}`;
    const history = [`Created by ${creatorName} on ${formatDateForHistory()} with a budget of $${parseFloat(budget).toFixed(2)}`];
    try {
        const result = await pool.query(
            'INSERT INTO financial_responsibilities (id, name, budget, model, assignee, distributed_allocations, history) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [id, name, budget, model, assignee, JSON.stringify(distributedAllocations), history]
        );
        res.json(toCamelCase(result.rows[0]));
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

app.put('/api/responsibilities/:id', async (req, res) => {
    const { id } = req.params;
    const { name, budget, model, assignee, distributedAllocations, editorName } = req.body;
    try {
        const existingRes = await pool.query('SELECT * FROM financial_responsibilities WHERE id = $1', [id]);
        if (existingRes.rows.length === 0) return res.status(404).send('Not found');
        const existing = existingRes.rows[0];
        
        let history = existing.history || [];
        if (parseFloat(budget) !== parseFloat(existing.budget)) {
             history.push(`Budget updated manually from $${parseFloat(existing.budget).toFixed(2)} to $${parseFloat(budget).toFixed(2)} by ${editorName} on ${formatDateForHistory()}`);
        } else {
             history.push(`Details updated by ${editorName} on ${formatDateForHistory()}`);
        }

        const result = await pool.query(
            'UPDATE financial_responsibilities SET name = $1, budget = $2, model = $3, assignee = $4, distributed_allocations = $5, history = $6 WHERE id = $7 RETURNING *',
            [name, budget, model, assignee, JSON.stringify(distributedAllocations), history, id]
        );
        res.json(toCamelCase(result.rows[0]));
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

app.post('/api/responsibilities/reallocate', async (req, res) => {
    const { fromId, toId, amount, reallocatorName } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const fromRes = await client.query('SELECT * FROM financial_responsibilities WHERE id = $1', [fromId]);
        const toRes = await client.query('SELECT * FROM financial_responsibilities WHERE id = $1', [toId]);

        const fromBudget = parseFloat(fromRes.rows[0].budget);
        if (fromBudget < amount) {
            await client.query('ROLLBACK');
            return res.status(400).send('Insufficient funds');
        }

        const date = formatDateForHistory();
        const fromHistory = `Reallocated -$${parseFloat(amount).toFixed(2)} to '${toRes.rows[0].name}' by ${reallocatorName} on ${date}`;
        const toHistory = `Reallocated +$${parseFloat(amount).toFixed(2)} from '${fromRes.rows[0].name}' by ${reallocatorName} on ${date}`;

        const updateFrom = await client.query(
            'UPDATE financial_responsibilities SET budget = budget - $1, history = array_append(history, $2) WHERE id = $3 RETURNING *',
            [amount, fromHistory, fromId]
        );

        const updateTo = await client.query(
            'UPDATE financial_responsibilities SET budget = budget + $1, history = array_append(history, $2) WHERE id = $3 RETURNING *',
            [amount, toHistory, toId]
        );

        await client.query('COMMIT');
        res.json({
            success: true,
            updatedResponsibilities: [toCamelCase(updateFrom.rows[0]), toCamelCase(updateTo.rows[0])]
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).send('Server error');
    } finally {
        client.release();
    }
});

// Expenses
app.get('/api/expenses', async (req, res) => {
    try {
        // Order by created_at DESC if available, or date DESC
        const result = await pool.query('SELECT * FROM expenses WHERE is_deleted = false ORDER BY created_at DESC, date DESC');
        res.json(result.rows.map(toCamelCase));
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

app.post('/api/expenses', async (req, res) => {
    const { vendor, invoiceNumber, date, lineItems, tax, total, notes, category, submittedBy, responsibilityId, attachments } = req.body;
    const id = `exp${Date.now()}`;
    const status = 'Pending';
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Fetch User Role
        const userRes = await client.query('SELECT role FROM users WHERE id = $1', [submittedBy]);
        const userRole = userRes.rows[0]?.role;

        // 2. Check Budget
        const respRes = await client.query('SELECT budget FROM financial_responsibilities WHERE id = $1', [responsibilityId]);
        if (respRes.rows.length === 0) {
            throw new Error('Responsibility not found');
        }
        const budget = parseFloat(respRes.rows[0].budget);

        const expensesRes = await client.query(
            'SELECT SUM(total) as spent FROM expenses WHERE responsibility_id = $1 AND status != \'Rejected\' AND is_deleted = false',
            [responsibilityId]
        );
        const currentSpent = parseFloat(expensesRes.rows[0].spent || 0);
        const newTotal = currentSpent + parseFloat(total);

        if (newTotal > budget && userRole !== 'Finance Manager') {
            await client.query('ROLLBACK');
            return res.status(403).send(`Budget Exceeded: This expense (${total}) exceeds the remaining budget. Current spent: ${currentSpent}, Budget: ${budget}. Contact a manager.`);
        }

        // 3. Insert Expense
        const result = await client.query(
            'INSERT INTO expenses (id, vendor, invoice_number, date, line_items, tax, total, notes, category, status, submitted_by, responsibility_id, attachment, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW()) RETURNING *',
            [id, vendor, invoiceNumber, date, JSON.stringify(lineItems), tax, total, notes, category, status, submittedBy, responsibilityId, JSON.stringify(attachments)]
        );
        
        await client.query('COMMIT');
        res.json(toCamelCase(result.rows[0]));
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).send(err.message || 'Server error');
    } finally {
        client.release();
    }
});

app.put('/api/expenses/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        const result = await pool.query(
            'UPDATE expenses SET status = $1 WHERE id = $2 RETURNING *',
            [status, id]
        );
        res.json(toCamelCase(result.rows[0]));
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
