const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const Member = require('./models/member');
const app = express();
require('dotenv').config();
app.use(express.static('public'));

const port = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Middleware
app.use(bodyParser.urlencoded({
  extended: true
}));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Route to display gym members
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

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
