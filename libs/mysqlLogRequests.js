/**
 * Created by Администратор on 24.07.2017.
 */
var mysql   = require('mysql');
var crypto  = require('crypto');
var mail    = require('./mailer');
var fs      = require('fs');

var pool  = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "",
    database: "matcha",
    charset	: "utf8_general_ci"
});

/*
*   [function registration]
*   Функция регистрации пользователя с последующей отправкой письма
*   для подтверждения аккаунта.
*
*   Функция принимает обьект body с данными о пользователе. Все данные
*   прошли проверку не являются пустыми и защищены от htnk-иньекций. И
*   callback, функция не должна быть пустой, в нее передается данные о
*   выполнении sql запроса
*/

module.exports.registration = function (req, callback) {
    var body = req.body;
    pool.getConnection(function(err, connection) {
        if (err) throw err;
        var userKey         = crypto.createHmac('sha256', body.userEmail).update('key').digest('hex');
        var hashedUserPass  = crypto.createHmac('sha256', body.userPassword).update('pass').digest('hex');

        var cols = {
            name                : body.userName,
            surname             : body.userSurname,
            email               : body.userEmail,
            user_key            : userKey,
            pass                : hashedUserPass,
            age                 : body.userAge,
            sex                 : body.userSex,
            sex_orientation     : body.userSexOrientation,
            country             : body.userCountry,
            city                : body.userCity,
            famous              : 0,
            photo_activated     : 0,
            activated           : 0,
            latitude            : body.latitude,
            longitude           : body.longitude
        }

        var sql = "SELECT email FROM registered_users WHERE email = ?"
        connection.query(sql, [cols.email], function (err, result, fields) {
            if (err) throw err;
            if (!result[0]) {
                if (err) throw err;
                var sql = "INSERT INTO registered_users SET ?"
                connection.query(sql, cols, function (err, result) {
                    if (err) throw err;
                    mail.send(body.userEmail, {
                        from    : 'matcha.unitschool@gmail.com',
                        to      : body.userEmail,
                        subject : 'Matcha, registration. Confirm your account.',
                        html    : (
                            '<td align="right">'+
                            '<table border="0" cellpadding="0" cellspacing="0" style=\"width: 75%;max-width:600px;display: block;margin: 0 auto;height: 100%;\">'+
                            '<tbody style="width: 100%;display: block;margin: 0 auto; background: #557780;padding: 10px;">'+
                            '<tr>'+
                            '<td>'+
                            '<a href="http://www.twitter.com/">'+
                            '<img src="../../images/userPhotos/test-user/1.jpg" alt="Twitter" width="38" height="38" style="display: block;" border="0" />'+
                            '</a>'+
                            '</td>'+
                            '<td style="font-size: 0; line-height: 0;" width="20">&nbsp;</td>'+
                            '<td>'+
                            '<a href="http://www.twitter.com/">'+
                            '<img src="../../images/userPhotos/test-user/1.jpg" alt="Facebook" width="38" height="38" style="display: block;" border="0" />'+
                            '</a>'+
                            '</td>'+
                            '<td style="font-size: 0; line-height: 0;" width="20">&nbsp;</td>'+
                            '<td>'+
                            '<h1 style="margin: 0; color: #fff;">Matcha</h1>'+
                            '</td>'+
                            '</tr>'+
                            '</tbody>'+
                            '<tbody style="display:block;height: 200px; background: #EBE1E2;width:100%;padding:10px;padding-top:100px;">'+
                            '<tr style="width: 100%;display: block;text-align: -webkit-center;">'+
                            '<td><h2 style="font-weight: 800;margin:0;">Confirm your account, click on link below</h2></td>'+
                            '</tr>'+
                            '<tr style="width:100%;display:block;text-align:-webkit-center;text-align:center;">'+
                            '<td style="width: 100%;display: block;">'+
                            '<a href="http://localhost:3000/access?acc='+userKey+'" style="width:100%;display:block;"><h2 style="font-weight: 800;">http://localhost:3000</h2>'+
                            '</a>'+
                            '</td>'+
                            '</tr>'+
                            '</tbody>'+
                            '</table>'+
                            '</td>'
                        )
                    });
                    if (!fs.existsSync('public/images/userPhotos/'+cols.user_key)) {
                        fs.mkdirSync('public/images/userPhotos/'+cols.user_key);
                    }
                    connection.release();
                    callback({status : 'added'})
                });
            } else {
                connection.release();
                callback({status : 'already exists'})
            }
        });
    });
}

/*
 *  [function activation]
 *  Функция активации аккаунта получает ключ пользователя, body.key не
 *  может быть пустым, если пользователь с данным ключом не найден
 *  функция завершит свое выполнение.
 *
 *  body.key - ключ пользователя.
 */

module.exports.activation = function (body, callback) {
    pool.getConnection(function(err, con) {
        if (err) throw err;
        var values = {
            user_key: body.key
        };
        var sql = "UPDATE registered_users SET activated = 1 WHERE ?";
        con.query(sql, values, function (err, result) {
            if (err) throw err;
            con.release();
            // result.changedRows == 0 ? console.log('user key not found') : console.log("user activation succesful");
        });
    });
}

/*
*  [function login]
*   Функция входа в аккаунт получает нехешированый пароль и имейл
*   пользователя, если пользователь найден он записывается в сессию
*   в ином же случае выводится ошибка с предложением восстановить
*   свой пароль.
*
*   body.userEmail  - имейл пользователя.
*   body.userPass   - пароль пользователя.
*/

module.exports.login = function (req, callback)  {
    var body = req.body;
    pool.getConnection(function(err, con) {
        if (err) throw err;
        getUser(req, con);

    });

    function getUser(req, con) {
        var values = {
            pass    : '' + crypto.createHmac('sha256', body.userPass).update('pass').digest('hex'),
            email   : '' + body.userEmail
        };
        var sql = "SELECT `user_key`, `photo_activated`, `activated` FROM `registered_users` WHERE pass = ? AND email = ?";
        con.query(sql, [values.pass, values.email], function (err, result, fields) {
            if (err) throw err;
            if (result[0] && result[0].activated == 1) {
                req.session.user_key = result[0].user_key;
                req.session.avatar_activated = result[0].photo_activated;
                setOnline(con, result);
            } else {
                con.release();
                callback(result[0] && result[0].activated == 1 ? result[0] : null);
            }
        });
    }

    function setOnline(con, r) {
        var sql = "UPDATE `registered_users` SET `online` = '1' WHERE `user_key` = ?";
        con.query(sql, [req.session.user_key], function (err, result, fields) {
            if (err) throw err;
            con.release();
            callback(r[0] && r[0].activated == 1 ? r[0] : null);
        });
    }
}

/*
 *  [function reset]
 *   Функция восстановления пароля, пользователь вводит свой имейл,
 *   на почту приходит ключ который надо вставить в поле подтверждения
 *   пользователя после чего пользователь может изменить свой пароль
 *   на новый. В функцию может прийти 1 из 2 аргументов.
 *
 *   req.body.mail  - для отправки письма на почту.
 *   req.body.key   - для проверки правильности введенного ключа.
 *
 *   Если нету какого то из этих параметров функция возвратит 0 и
 *   закончит выполнение.
 */

module.exports.reset = function (req, callback) {
    if (req.body.mail) {
        sendMailWithKey(req, callback)
    } else if (req.body.key) {
        resetPassword (req, callback);
    } else {
        return (0);
    }

    function sendMailWithKey (body, callback) {
        var body = req.body;
        pool.getConnection(function(err, con) {
            if (err) throw err;
            var values = {
                email   : body.email
            };
            var sql = "SELECT `user_key` FROM `registered_users` WHERE ?";
            con.query(sql, values, function (err, result, fields) {
                if (err) throw err;
                if (result[0]) {
                    mail.send(values.email, {
                                from    : 'matcha.unitschool@gmail.com',
                                to      : values.email,
                                subject : 'Matcha, please confirm reset of your password',
                                html    : (
                                    '<td align="right">'+
                                        '<table border="0" cellpadding="0" cellspacing="0" style=\"width: 75%;max-width:600px;display: block;margin: 0 auto;height: 100%;\">'+
                                            '<tbody style="width: 100%;display: block;margin: 0 auto; background: #557780;padding: 10px;">'+
                                                '<tr>'+
                                                    '<td>'+
                                                        '<a href="http://www.twitter.com/">'+
                                                        '<img src="../../images/userPhotos/test-user/1.jpg" alt="Twitter" width="38" height="38" style="display: block;" border="0" />'+
                                                        '</a>'+
                                                    '</td>'+
                                                    '<td style="font-size: 0; line-height: 0;" width="20">&nbsp;</td>'+
                                                    '<td>'+
                                                        '<a href="http://www.twitter.com/">'+
                                                            '<img src="../../images/userPhotos/test-user/1.jpg" alt="Facebook" width="38" height="38" style="display: block;" border="0" />'+
                                                        '</a>'+
                                                    '</td>'+
                                                    '<td style="font-size: 0; line-height: 0;" width="20">&nbsp;</td>'+
                                                    '<td>'+
                                                        '<h1 style="margin: 0; color: #fff;">Matcha</h1>'+
                                                    '</td>'+
                                                '</tr>'+
                                            '</tbody>'+
                                            '<tbody style="display:block;height: 200px; background: #EBE1E2;width:100%;padding:10px;padding-top:100px;">'+
                                                '<tr style="width: 100%;display: block;text-align: -webkit-center;">'+
                                                    '<td><h2 style="font-weight: 800;margin:0;">Your key to restore your password</h2></td>'+
                                                '</tr>'+
                                                '<tr style="width:100%;display:block;text-align:-webkit-center;text-align:center;">'+
                                                    '<td style="display:block;">'+result[0].user_key+'</td>'+
                                                '</tr>'+
                                            '</tbody>'+
                                        '</table>'+
                                    '</td>'
                                )
                            });
                    con.release();
                    callback('mail sended');
                    req.session.emailForResetPass = body.email;
                    console.log('request.session', req.session)
                }
                else {
                    con.release();
                    callback(null);
                }
            });
        });
    }

    function resetPassword (req, callback) {
        var body = req.body;

        pool.getConnection(function(err, con) {
            if (err) throw err;
            var values = [
                crypto.createHmac('sha256', body.pass).update('pass').digest('hex'),
                body.key,
                req.session.emailForResetPass
            ]
            var sql = "UPDATE `registered_users` SET `pass` = ? WHERE `user_key` = ? AND `email` = ?";
            con.query(sql, values, function (err, result, fields) {
                if (err) throw err;
                if (result.message == '(Rows matched: 1  Changed: 1  Warnings: 0') {
                    con.release();
                    callback('password changed');
                    delete req.session.emailForResetPass;
                } else if (result.message == '(Rows matched: 1  Changed: 0  Warnings: 0') {
                    con.release();
                    callback('old password');
                    } else {
                    con.release();
                    callback(null);
                    delete req.session.emailForResetPass;
                }
            });
        });
    }
}

