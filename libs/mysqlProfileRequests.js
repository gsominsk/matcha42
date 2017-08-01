var mysql   = require('mysql');
var fs      = require('fs');
var async   = require('async');
var _users  = {};

/*
*   [function addUserToStream]
*   Во время входа пользователя на сайт мы записываем его в глобадбный
*   массив активных пользователей, при выходе из сайта или закрытии
*   странички пользователь удаеляется из этого списка.
*
*   req - нужен для получения ключа пользователя.
*   res - нужен для удаления пользователя при закрытии/выходе странички.
*/

module.exports.addUserToStream = function (req, res) {
    if (req.session.user_key) {
        _users[req.session.user_key] = {
            user_key    : req.session.user_key,
            res         : res
        };
        console.log('USER ADDED TO STREAM')

        res.on('close', function () {
            delete _users[req.session.user_key];
            console.log('USER DELETED FROM STREAM')
            console.log(_users);
        });
    }
    console.log(_users)
}

/*
*   [function getProfileData]
*   Просто выдает всю информацию о пользователе который данный момент
*   записан в сессии, кроме пароля :D, я ж не совсем дибил.
*
*   req         - для получения ключа пользователя.
*   res         - не используется.
*   callback    - отправка полученных данных обратно.
*/

module.exports.getProfileData = function (req, res, callback) {
    var body = req.body;
    var con = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "",
        database: "matcha",
        charset	: "utf8_general_ci"
    });
    con.connect(function(err) {
        if (err) throw err;
        var values = {
            user_key: req.body.user_key ? req.body.user_key : req.session.user_key
        };
        var sql = "SELECT registered_users.*, user_hobbies.hobbie FROM registered_users "+
                "LEFT JOIN user_hobbies "+
                "ON (registered_users.user_key = user_hobbies.user_key) "+
                "WHERE "+
                "registered_users.user_key = ?";
        con.query(sql, [values.user_key], function (err, result, fields) {
            if (err) throw err;
            var dirPath = 'public/images/userPhotos/'+values.user_key+'/';

            if (result[0]) {
                result[0].hobbies       = [];
                result[0].photos        = [];
                //add hobbies
                for (var i = 0; i < result.length; i++) {
                    result[i].hobbie != null ? result[0].hobbies.push(result[i].hobbie) : 0;
                }
                // deleting important info
                delete result[0].hobbie;
                delete result[0].pass;
                //add user photos
                fs.readdir(dirPath, function (err, files) {
                    files.forEach(function (file) {
                        result[0].photos.push('images/userPhotos/'+values.user_key+'/'+file);
                    });
                    callback(result[0]);
                });
            } else
                callback(null);
        });
    });
}

/*
 *   [function getFriendsList]
 *   Фунцкция выдает лист с друзьями по ключу который записан в сессии.
 *
 *  req         - для получения ключа пользователя.
 *  res         - не используется.
 *  callback    - возвращает список людей.
 */

module.exports.getFriendsList = function (req, res, callback) {
    console.log('SERVER getFriendsList')
    var con = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "",
        database: "matcha",
        charset	: "utf8_general_ci"
    });
    con.connect(function(err) {
        if (err) throw err;
        var values = {
            user_key: req.session.user_key
        };
        var sql = "SELECT friend_key FROM user_friends WHERE user_key = ?";
        con.query(sql, [values.user_key], function (err, result, fields) {
            if (err) throw err;
            if (result[0]) {
                for (var i = 0, keys = 'SELECT user_key, name, surname, photo_activated FROM registered_users WHERE '; i < result.length; i++) {
                    keys += ("user_key = '" + result[i].friend_key + "'" + (i + 1 < result.length ? " OR " : " "));
                }
                con.query(keys, function (err, result, fields) {
                    if (err) throw err;
                    for (var i = 0; i < result.length; i++) {
                        if (result[i].photo_activated != 0)
                            result[i].photo_activated = 'images/userPhotos/'+result[i].user_key+'/'+result[i].photo_activated;
                    }
                    callback(result)
                });
            } else
                callback(null);
        });
    });
}

/*
 *   [function setUserHobbie]
 *   Фунцкция записывает данные в таблицу.
 *
 *
 *  req.body.hash   - Увлечение пользователя.
 *  res             - не используется.
 *  callback        - возвращает true если записалась и false в случае ошибки.
 */

module.exports.setUserHobbie = function (req, res, callback) {
    console.log('[SERVER] -> setUserHobbies')
    var con = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "",
        database: "matcha",
        charset	: "utf8_general_ci"
    });
    con.connect(function(err) {
        if (err) throw err;
        console.log(req.body);
        var values = {
            user_key: req.session.user_key,
            hobbie  : req.body.hash
        };
        var sql = "INSERT INTO user_hobbies SET ?";
        con.query(sql, values, function (err, result, fields) {
            if (err) throw err;
            console.log(result);
            callback(result.affectedRows > 0 ? true : false);
        });
    });
}

/*
 *   [function uploadUserPhotos]
 *   Обновляет фотографии пользователя. Если количество новых фото + количество
 *   старых больше 4 старые оно заменит на новые фото.
 *
 *  req.body.photo          - Массив с данными о фото.
 *  req.body.photo.src      - Фотография в 64.
 *  req.body.photo.fileName - Название фотографии.
 *  res                     - Не используем.
 *  callback                - Возвращает true фото сохранені и false в случае ошибки.
 */

module.exports.uploadUserPhotos = function (req, res, callback) {
    console.log('[uploadUserPhotos]');
    var dirPath     = 'public/images/userPhotos/' + req.session.user_key + '/';

    // check if some files already exists and sum of files < 5
    // console.log(req.body.photos);

    // checkUserFiles(req, function (result) {
    //     if (result == 'true') {
    //             console.log('bla bla bla');
    //             // console.log(req.body.photos);
    //             this.values      = [];
    //             for (var i = 0; i < req.body.photos.length; i++) {
    //                 var buff = new Buffer(req.body.photos[i].src
    //                     .replace(/^data:image\/(png|gif|jpeg);base64,/,''), 'base64');
    //                 this.values[i] = [
    //                     req.session.user_key,
    //                     req.body.photos[i].fileName
    //                 ];
    //                 fs.writeFile(dirPath + req.body.photos[i].fileName, buff, function (err) {
    //                     if (err) throw err;
    //                 });
    //             }
    //             insertUserPhotos(req, this.values, callback);
    //     } else {
    //         callback(false);
    //     }
    // });
}


function checkUserFiles (req, callback) {
    var dirPath     = 'public/images/userPhotos/' + req.session.user_key + '/';
    var fs = require('fs');
    var count = 0;
    var allFilesName = [];

    console.log('1 : ', req.body.photos.length);

    async.series([
            function (callback) {
                fs.readdir(dirPath, function (err, files) {
                    files.forEach(function (file) {
                        allFilesName.push(file);
                        count++;
                    });
                });
                console.log('1.5');
                callback({filesNames: allFilesName});
            },
        ], function(result) {
            // return (req.body.photos.length + count > 5 ? 'too many files' : true);
            for (j = 0; j < result.filesNames.length; j++) {
                console.log('[j] : ', j);
                for (var i = 0; i < req.body.photos.length; i++) {
                    console.log('[i] : ', i);
                    if (req.body.photos[i].fileName == file) {
                        req.body.photos.splice(i, 1);
                        console.log('spliced');
                        console.log('2 : ', req.body.photos.length);
                    }
                }
            }
            console.log('3 : ', req.body.photos.length);
            callback(true);
        });

}

function insertUserPhotos (req, values, callback) {
    console.log('[uploadUserPhotos] -> [countUserFiles] -> [insertUserPhotos]');
    var con = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "",
        database: "matcha",
        charset	: "utf8_general_ci"
    });

    con.connect(function(err) {
        if (err) throw err;
        var _result;
        var sql = "INSERT INTO `photos` (`user_key`, `photo_name`) VALUES ?"
        console.log('VALUES', values);

        con.query(sql, [values], function (err, result, fields) {
            if (err) throw err;
            _result = result;
            if (req.session.avatar_activated == 0 && result.affectedRows > 0) {
                sql = "UPDATE `registered_users` SET `photo_activated` = ? WHERE `user_key` = ?";
                con.query(sql, [values[0][1], values[0][0]], function (err, result, fields) {
                    if (err) throw err;
                    sql = "INSERT INTO `active_users` SET `user_key` = ?, `activated` = 1";
                    req.session.avatar_activated = values[0][1];
                    con.query(sql, [values[0][0]], function (err, result, fields) {
                        if (err) throw err;
                        console.log('sending back');
                        callback(true);
                    });
                });
            } else {
                callback(true);
            }
        });
    });
}
/*
 *   [function uploadUserAvatar]
 *   Обновляет фотографии пользователя. Если количество новых фото + количество
 *   старых больше 4 старые оно заменит на новые фото.
 *
 *  req.body.photo          - Фото для аватара.
 *  req.body.photo.src      - Фотография в 64.
 *  req.body.photo.тame     - Название фотографии.
 *  res                     - Не используем.
 *  callback                - Возвращает true фото сохранено и false в случае ошибки.
 */

module.exports.uploadUserAvatar = function (req, res, callback) {
    var dirPath     = 'public/images/userPhotos/' + req.session.user_key + '/';

    console.log(req.body.photo);

    var buff = new Buffer(req.body.photo.src
        .replace(/^data:image\/(png|gif|jpeg);base64,/,''), 'base64');
    fs.writeFile(dirPath + req.body.photo.name, buff, function (err) {
        if (err) throw err;
    });

    var con = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "",
        database: "matcha",
        charset	: "utf8_general_ci"
    });
    con.connect(function(err) {
        if (err) throw err;
        var _result;
        var sql = "INSERT INTO `photos` (`user_key`, `photo_name`) VALUES (?, ?)";

        con.query(sql, [req.session.user_key, req.body.photo.name], function (err, result, fields) {
            if (err) throw err;
            _result = result;
            if (result.affectedRows > 0) {
                sql = "UPDATE `registered_users` SET `photo_activated` = ? WHERE `user_key` = ?";
                con.query(sql, [req.body.photo.name, req.session.user_key], function (err, result, fields) {
                    if (err) throw err;
                    sql = "INSERT INTO `active_users` SET `user_key` = ?, `activated` = 1";
                    con.query(sql, [req.session.user_key], function (err, result, fields) {
                        if (err) throw err;
                        callback(true);
                    });
                });
            }
        });
    });
}