const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const Member = require('./models/member');
const app = express();
require('dotenv').config();
app.use(express.static('public'));

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

app.get('/', async (req, res) => {
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

    res.render('index', {
      members,
      searchQuery
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/addmember', (req, res) => {
  res.render('addmember');
});

app.post('/addmember', async (req, res) => {
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

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
