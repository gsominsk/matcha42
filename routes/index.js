
/*
 * GET home page.
 */

exports.index = function(req, res) {
    res.render('index', { title: 'Matcha', layout: 'index-layout' })
};
exports.profile = function(req, res) {
    res.render('profile', { title: 'Matcha', layout: 'profile-layout' })
};
exports.login = function(req, res) {
    res.render('login', { title: 'Matcha', layout: 'login-layout' })
};
