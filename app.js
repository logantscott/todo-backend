// Load Environment Variables from the .env file
const client = require('./lib/client.js');
// Application Dependencies
const express = require('express');
// (add cors, pg, and morgan...)
const cors = require('cors');
const morgan = require('morgan');

// Database Client
// (create and connect using DATABASE_URL)
client.connect();

// Application Setup
const app = express();
// (add middleware utils: logging, cors, static files from public)
// app.use(...)
//this will let us host images on our server
// app.use('/assets', express.static('assets'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(cors());

// Auth Routes
const createAuthRoutes = require('./lib/auth/create-auth-routes');

const authRoutes = createAuthRoutes({
    selectUser(email) {
        return client.query(`
            SELECT id, name, email, hash 
            FROM users
            WHERE email = $1;
        `,
        [email]
        ).then(result => result.rows[0]);
    },
    insertUser(user, hash) {
        return client.query(`
            INSERT into users (name, email, hash)
            VALUES ($1, $2, $3)
            RETURNING id, name, email;
        `,
        [user.email, hash]
        ).then(result => result.rows[0]);
    }
});

// before ensure auth, but after other middleware:
app.use('/api/auth', authRoutes);

// for every route, on every request, make sure there is a token
const ensureAuth = require('./lib/auth/ensure-auth');

app.use('/api', ensureAuth);

// API Routes
app.get('/', async(req, res, next) => {
    try {
        res.json({
            welcome: 'home'
        });
    } catch (err) {
        next(err);
    }
});

app.get('/todos', async(req, res, next) => {
    try {
        const result = await client.query(`
            SELECT
                *
            FROM todos
            ORDER BY id;
        `);

        res.json(result.rows);
    } catch (err) {
        next(err);
    }
});

app.post('/todos', async(req, res, next) => {
    try {
        const result = await client.query(`
        INSERT INTO todos (task, complete)
        VALUES ($1, false)
        RETURNING *;
        `,
        [req.body.task]);

        res.json(result.rows[0]);
    } catch (err) {
        next(err);
    }
});

app.put('/todos', async(req, res, next) => {
    try {
        const result = await client.query(`
        UPDATE todos
        SET complete = $1
        WHERE todos.id = $2
        RETURNING *;
        `,
        [req.body.complete, req.body.id]);

        res.json(result.rows[0]);
    } catch (err) {
        next(err);
    }
});

app.delete('/todos', async(req, res, next) => {
    try {
        const result = await client.query(`
        DELETE FROM todos
        WHERE todos.id = $1
        RETURNING *;
        `,
        [req.body.id]);

        res.json(result.rows[0]);
    } catch (err) {
        next(err);
    }
});

// http method and path...

module.exports = {
    app: app
};