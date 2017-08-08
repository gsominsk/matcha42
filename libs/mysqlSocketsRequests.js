var mysql   = require('mysql');
var fs      = require('fs');
var async   = require('async');

var pool  = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "",
    database: "matcha",
    charset	: "utf8_general_ci"
});

/*
 *  [function getNotificationInfo]
 *
 *  Функция вытаскивает полное имя пользователя и его аватар по ключу пользователя.
 *
 *  req.key                 -   Ключ пользователя для получения информации.
 *  res                     -   Не используем.
 *  callback                -   Возвращает обьект с аватаром и именем пользователя.
 */

module.exports.getNotificationInfo = function (req, callback) {
    pool.getConnection(function(err, con) {
        if (err) throw err;
        var sql = "SELECT name, surname, photo_activated, user_key FROM registered_users WHERE user_key = ?";
        con.query(sql, [req.key], function (err, result, fields) {
            console.log(result);
            con.release();
            if (result[0].photo_activated == 0)
                result[0].photo_activated = 'images/unknown.jpg';
            else
                result[0].photo_activated = 'images/userPhotos/'+req.key+'/'+result[0].photo_activated;
            callback(result[0]);
        });

    });
}