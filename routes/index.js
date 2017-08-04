var request = require('../libs/mysqlLogRequests');
/*
 * GET home page.
 */
module.exports = function (app) {
    app.get('/', function (req, res) {
        res.render('index', { title: 'Matcha', layout: 'index-layout' })
    });
    app.get('/profile', function (req, res) {
        if (!req.session.user_key) return res.redirect('/login');
        res.render('profile', { title: 'Matcha', layout: 'profile-layout' })
    });
    app.get('/login', function (req, res) {
        res.render('login', { title: 'Matcha', layout: 'login-layout' })
    });
    app.get('/reset', function (req, res) {
        res.render('reset', { title: 'Matcha', layout: 'reset-layout' })
    });
    app.get('/access', function (req, res) {
        var body = {key: req.query.acc};
        request.activation(body);
        res.render('access', { title: 'Matcha', layout: 'access-layout' })
    });
}

 
