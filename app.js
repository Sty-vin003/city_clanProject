const express = require('express');
const path = require('path');
const app = express();
const mysql = require('mysql');
const multer = require('multer');
const bcrypt = require('bcrypt');
const PORT = process.env.PORT || 3041;

const saltRounds = 10; // for bcrypt password hashing

// Middleware to handle JSON request bodies
app.use(express.json());

// Serve static files (CSS, HTML)
app.use(express.static(__dirname));

// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Destination folder for uploaded files
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname); // Use original file name
    }
});
const upload = multer({ storage: storage });

// Route for home page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Database connection
const database = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'city_clan'
});

database.connect((err) => {
    if (err) throw err;
    console.log('Connection to database was successful');
});

// Route for reporting issues
app.post('/report-issue', upload.single('photoupload'), (req, res) => {
    const { issuetype, description, location } = req.body;
    const photoupload = req.file ? req.file.filename : null;

    const request = "INSERT INTO city_feedback (issue, description, location, photo) VALUES (?, ?, ?, ?)";
    database.query(request, [issuetype, description, location, photoupload], (err, result) => {
        if (err) {
            console.error('Error inserting data:', err);
            res.status(500).send('Error inserting data');
        } else {
            console.log('Issue data inserted:', result);
            res.send('Issue submitted successfully');
        }
    });
});

app.post('/vote-project', (req, res) => {
    const { projectName } = req.body;

    if (!projectName) {
        return res.status(400).json({ message: 'Please select a project to vote for.' });
    }

    console.log(`Vote received for project: ${projectName}`);

    // Here, you would normally save the vote to a database. We'll just respond with a message for now.
    res.status(200).json({ message: `You voted for ${projectName}. Thank you!` });
});


// Route for handling votes
app.post('/vote-project', (req, res) => {
    const { projectName } = req.body;

    if (!projectName) {
        return res.status(400).json({ message: 'Please select a project to vote for.' });
    }

    console.log(`Vote received for project: ${projectName}`);

    // Here, you would normally save the vote to a database. We'll just respond with a message for now.
    res.status(200).json({ message: `You voted for ${projectName}. Thank you!` });
});

// Register Route
app.post('/register', (req, res) => {
    const { username, email, password } = req.body;
    // Check if email is already registered
    database.query('SELECT email FROM residents WHERE email = ?', [email], (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Database error.' });
        }
        if (result.length > 0) {
            return res.status(400).json({ message: 'Email is already registered.' });
        }
        // Hash the password before saving
        bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
            if (err) {
                return res.status(500).json({ message: 'Error hashing password.' });
                
            }
            console.log('Hashed Password:', hashedPassword); // Log the hashed password     
            // Insert new user into the database
            const sql = 'INSERT INTO residents (username, email, password) VALUES (?, ?, ?)';
            database.query(sql, [username, email, hashedPassword], (err, result) => {
                if (err) {
                    return res.status(500).json({ message: 'Error registering user.' });
                }
                res.status(200).json({ message: 'Registration successful!' });
            });
        });
    });
});


//login route
app.post('/login', (req, res) => {
    const { email, password } = req.body;
     // Check if email or password are missing
     if (!email || !password) {
        return res.status(400).json({ message: 'Email or password is missing.' });
    } 

    // Check if user exists
    const sql = 'SELECT * FROM residents WHERE email = ?';
    database.query(sql, [email], (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Database error.' });
        }
        if (result.length === 0) {
            return res.status(400).json({ message: 'User not found.' });
        }

        const user = result[0];
        const hashedPassword = user.password; // Log the hashed password
        // Compare password
        bcrypt.compare(password, hashedPassword, (err, isMatch) => {
            if (err) {
                return res.status(500).json({ message: 'Error checking password.', error: err.message });
            }
            if (!isMatch) {
                return res.status(400).json({ message: 'Incorrect password.' });
            }        
            res.status(200).json({ message: `Welcome, ${user.username}!`, username: user.username});      
        });
    });
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

