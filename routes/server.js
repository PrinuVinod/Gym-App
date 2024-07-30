const Member = require('./models/Member');

app.get('/', async (req, res) => {
    const members = await Member.find();
    res.render('index', {
        members
    });
});

app.get('/add', (req, res) => {
    res.render('add');
});

app.post('/add', async (req, res) => {
    const newMember = new Member({
        name: req.body.name,
        lastPaymentDate: req.body.lastPaymentDate,
        nextFeeDueDate: req.body.nextFeeDueDate
    });
    await newMember.save();
    res.redirect('/');
});
