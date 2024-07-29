const Member = require('./models/Member');

// Home route to display members
app.get('/', async (req, res) => {
    const members = await Member.find();
    res.render('index', {
        members
    });
});

// Add member form route
app.get('/add', (req, res) => {
    res.render('add');
});

// Add member form submission
app.post('/add', async (req, res) => {
    const newMember = new Member({
        name: req.body.name,
        lastPaymentDate: req.body.lastPaymentDate,
        nextFeeDueDate: req.body.nextFeeDueDate
    });
    await newMember.save();
    res.redirect('/');
});
