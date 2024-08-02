const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const User = require('./models/user');
const Member = require('./models/member');
const app = express();
require('dotenv').config();

app.use(express.static('public'));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your_secret_key',
  resave: false,
  saveUninitialized: true,
}));

const port = process.env.PORT || 3000;

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use(bodyParser.urlencoded({
  extended: true
}));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    return next();
  }
  res.redirect('/login');
};

app.get('/', async (req, res) => {
  try {
    const members = await Member.find();
    res.render('index', {
      members
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/members', isAuthenticated, async (req, res) => {
  try {
    const searchQuery = req.query.search || '';
    let members;

    if (searchQuery) {
      members = await Member.find({
        $or: [{
            name: new RegExp(searchQuery, 'i')
          },
          {
            phone: new RegExp(searchQuery, 'i')
          }
        ]
      });
    } else {
      members = await Member.find();
    }

    res.render('members', {
      members,
      searchQuery
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/addmember', isAuthenticated, (req, res) => {
  res.render('addmember');
});

app.post('/addmember', isAuthenticated, async (req, res) => {
  try {
    const {
      name,
      phone,
      lastpayment,
      age
    } = req.body;

    const lastPaymentDate = new Date(lastpayment);
    const nextFeeDueDate = new Date(lastPaymentDate.setMonth(lastPaymentDate.getMonth() + 1));

    const newMember = new Member({
      name,
      phone,
      lastpayment: new Date(lastpayment),
      due: nextFeeDueDate,
      age
    });

    await newMember.save();
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', async (req, res) => {
  const {
    username,
    password
  } = req.body;
  try {
    console.log(`Login attempt for username: ${username}`);
    const user = await User.findOne({
      username
    });

    if (!user) {
      console.log('User not found');
      return res.status(401).send('Invalid username or password');
    }

    if (user.password === password) {
      // Successful login
      req.session.user = user; // Store user in session
      res.redirect('/members');
    } else {
      console.log('Password does not match');
      res.status(401).send('Invalid username or password');
    }
  } catch (err) {
    console.error('Error:', err);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Error destroying session:', err);
      res.status(500).send('Internal Server Error');
    } else {
      res.redirect('/login');
    }
  });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
