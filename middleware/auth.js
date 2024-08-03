const basicAuth = (req, res, next) => {
    const auth = req.headers['authorization'];

    if (!auth) {
        res.set('WWW-Authenticate', 'Basic realm="401"');
        res.status(401).send('Authentication required.');
        return;
    }

    const [username, password] = new Buffer.from(auth.split(' ')[1], 'base64').toString().split(':');

    if (username === process.env.BASIC_AUTH_USER && password === process.env.BASIC_AUTH_PASS) {
        next();
    } else {
        res.set('WWW-Authenticate', 'Basic realm="401"');
        res.status(401).send('Authentication required.');
    }
};

module.exports = basicAuth;
