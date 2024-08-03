const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const User = require('./models/user');
const Member = require('./models/member');
const Members = require('./models/members');
const app = express();
require('dotenv').config();

app.use(express.static('public'));

app.use(session({
  secret: process.env.SESSION_SECRET || 'your_secret_key',
  resave: false,
  saveUninitialized: true,
}));

const port = process.env.PORT || 3000;

mongoose.connect(process.env.MONGODB_URI);

app.use(bodyParser.urlencoded({
  extended: true
}));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    return next();
  }
  res.redirect('/ownerlogin');
};

const isAuthenticated1 = (req, res, next) => {
  if (req.session.memberss) {
    return next();
  }
  res.redirect('/memberlogin');
};

app.get('/selectuser', (req, res) => {
  res.render('select');
});

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
    console.log('Search Query:', searchQuery);

    // Get today's date
    const today = new Date();

    // Update member status where due date has passed
    await Member.updateMany({
        due: {
          $lte: today
        },
        status: true
      }, // Find members where due date is less than or equal to today and status is true
      {
        $set: {
          status: false
        }
      } // Update status to false
    );

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
      }).sort({
        name: 1
      });
      console.log('Members Found:', members);
    } else {
      members = await Member.find().sort({
        name: 1
      });
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

app.get('/editmember/:id', isAuthenticated, async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) {
      return res.status(404).send('Member not found');
    }
    res.render('editmember', {
      member
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/updatemember/:id', async (req, res) => {
  const memberId = req.params.id;
  const updatedData = req.body;

  try {
    await Member.findByIdAndUpdate(memberId, updatedData);
    res.redirect('/members');
  } catch (error) {
    console.error('Error updating member:', error);
    res.status(500).send('Server Error');
  }
});

const moment = require('moment'); // Add moment.js for date manipulation

app.post('/updatestatus/:id', async (req, res) => {
  const memberId = req.params.id;

  try {
    // Find the member by ID
    const member = await Member.findById(memberId);

    // Check if member exists
    if (!member) {
      return res.status(404).send('Member not found');
    }

    // Toggle status
    const newStatus = !member.status;

    // Update last payment date and due date
    const newLastPayment = new Date(); // Set to current date
    const newDueDate = moment(newLastPayment).add(1, 'months').toDate(); // Add one month

    // Update member with new status, last payment date, and due date
    await Member.findByIdAndUpdate(memberId, {
      status: newStatus,
      lastpayment: newLastPayment,
      due: newDueDate
    });

    res.redirect('/members');
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});


app.post('/updateactivity/:id', async (req, res) => {
  const memberId = req.params.id;
  const member = await Member.findById(memberId);
  const newActivity = !member.activity;
  await Member.findByIdAndUpdate(memberId, {
    activity: newActivity
  });
  res.redirect('/members');
});

app.post('/deletemember/:id', async (req, res) => {
  const memberId = req.params.id;

  try {
    await Member.findByIdAndDelete(memberId);
    res.redirect('/members');
  } catch (error) {
    console.error('Error deleting member:', error);
    res.status(500).send('Server Error');
  }
});

app.get('/editpass', isAuthenticated1, async (req, res) => {
  res.render('editpass', {
    title: 'Edit Password'
  });
});

app.post('/updatepass', isAuthenticated1, async (req, res) => {
  const memberId = req.session.memberss._id;
  const {
    oldPassword,
    newPassword
  } = req.body;

  try {
    const member = await Member.findById(memberId);

    if (!member) {
      return res.status(404).send('Member not found');
    }

    if (member.password !== oldPassword) {
      return res.status(401).send('Old password is incorrect');
    }

    member.password = newPassword;
    await member.save();

    res.redirect('/profile');
  } catch (err) {
    console.error('Error updating password:', err);
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

    const newMember = new Members({
      name,
      phone,
      password: phone,
      age,
      lastpayment: new Date(lastpayment),
      due: nextFeeDueDate,
      status: true,
      activity: true
    });

    await newMember.save();
    res.redirect('/members');
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/ownerlogin', (req, res) => {
  res.render('owner');
});

app.post('/ownerlogin', async (req, res) => {
  const {
    phone,
    password
  } = req.body;
  try {
    console.log(`Login attempt for phone: ${phone}`);
    const user = await User.findOne({
      phone
    });

    if (!user) {
      console.log('User not found');
      return res.status(401).send('Invalid phone number or password');
    }

    if (user.password === password) {
      req.session.user = user;
      res.redirect('/members');
    } else {
      console.log('Password does not match');
      res.status(401).send('Invalid phone number or password');
    }
  } catch (err) {
    console.error('Error:', err);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/profile', isAuthenticated1, async (req, res) => {
  try {
    const member = req.session.memberss;
    const searchQuery = req.query.search || '';

    if (!member) {
      return res.redirect('/memberlogin');
    }

    res.render('profile', {
      member,
      searchQuery
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/memberlogin', (req, res) => {
  res.render('memberslogin');
});

app.post('/memberlogin', async (req, res) => {
  const {
    phone,
    password
  } = req.body;
  try {
    console.log(`Login attempt for phone: ${phone}`);
    const member = await Member.findOne({
      phone
    });

    if (!member) {
      console.log('Member not found');
      return res.status(401).send('Invalid phone number or password');
    }

    if (member.password === password) {
      req.session.memberss = member;
      res.redirect('/profile');
    } else {
      console.log('Password does not match');
      res.status(401).send('Invalid phone number or password');
    }
  } catch (err) {
    console.error('Error:', err);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/ownerprofile', isAuthenticated, async (req, res) => {
  try {
    const user = req.session.user;
    const searchQuery = req.query.search || '';

    if (!user) {
      return res.redirect('/owner');
    }

    res.render('ownerprofile', {
      user,
      searchQuery
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/editowner/:id', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).send('User not found');
    }
    res.render('editowners', {
      user
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/updateowner/:id', isAuthenticated, async (req, res) => {
  const userId = req.params.id;
  const updatedData = req.body;

  try {
    await User.findByIdAndUpdate(userId, updatedData);
    res.redirect('/ownerprofile');
  } catch (error) {
    console.error('Error updating member:', error);
    res.status(500).send('Server Error');
  }
});

app.get('/editownerpass', isAuthenticated, async (req, res) => {
  res.render('editownerpasss', {
    title: 'Edit Password'
  });
});

app.post('/updateownerpass', isAuthenticated, async (req, res) => {
  const userId = req.session.user._id;
  const {
    oldPassword,
    newPassword
  } = req.body;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).send('Member not found');
    }

    if (user.password !== oldPassword) {
      return res.status(401).send('Old password is incorrect');
    }

    user.password = newPassword;
    await user.save();

    res.redirect('/ownerprofile');
  } catch (err) {
    console.error('Error updating password:', err);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Error destroying session:', err);
      res.status(500).send('Internal Server Error');
    } else {
      res.redirect('/selectuser');
    }
  });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
