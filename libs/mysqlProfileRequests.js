var mysql   = require('mysql');
var fs      = require('fs');
var async   = require('async');
var _users  = {};

var connData = {
    host: "localhost",
    user: "root",
    password: "",
    database: "matcha",
    charset	: "utf8_general_ci"
}

module.exports.logout = function (req, res, callback) {
    delete req.session.avatar_activated;
    delete req.session.user_key;
    callback(true);
}

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
                        if (file != result[0].photo_activated)
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
 *  [function setUserHobbie]
 *  Фунцкция записывает новые увелечения пользователя в тблицу user_hobbies.
 *
 *  req.body.hash   - Увлечение пользователя.
 *  res             - не используется.
 *  callback        - возвращает true если записалась и false в случае ошибки.
 */

module.exports.setUserHobbie = function (req, res, callback) {
    console.log('[SERVER] -> setUserHobbies')
    var con = mysql.createConnection(connData);
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
 *  [function uploadUserPhotos]
 *  Загружает фотографии пользователя.
 *
 *  Прежде чем загрузить делает проверку на кол-во уже загруженных фотографий +
 *  кол-во загружаемых и если сумма больше 5 прекращает работу с сообщением
 *  "фотографий слишком много, удалите старые прежде чем загрузить новые".
 *
 *  Так же делает проверку на типы данных, если нам пришшло не изображение (jpeg,
 *  jpg, png, ...) прекращает роботу и выдает сообщение об ошибке.
 *
 *  Фотография загружается в таблицу 'photos', после чего идет проверка.
 *
 *  Если фотографии загружаются в первый раз, первая фотография из списка
 *  загружается как АВАТАР пользователя, в 'registered_users' в ячейку
 *  'photo_activated' записывается аватар пользователя а так же данный пользователь
 *  вносится в таблицу активных пльзователей 'active_users'.
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
    checkUserFiles(req, function (result) {
        if (result == true) {
                this.values      = [];
                for (var i = 0; i < req.body.photos.length; i++) {
                    var buff = new Buffer(req.body.photos[i].src
                        .replace(/^data:image\/(png|gif|jpeg);base64,/,''), 'base64');
                    this.values[i] = [
                        req.session.user_key,
                        req.body.photos[i].fileName
                    ];
                    fs.writeFile(dirPath + req.body.photos[i].fileName, buff, function (err) {
                        if (err) throw err;
                    });
                }
                insertUserPhotos(req, this.values, callback);
        } else {
            callback(result);
        }
    });

    function checkUserFiles (req, callback) {
        var dirPath     = 'public/images/userPhotos/' + req.session.user_key + '/';
        var fs = require('fs');
        var count = 0;
        var allFilesName = [];

        async.series([
            function (callback) {
                fs.readdirSync(dirPath).forEach(function (file) {
                    allFilesName.push(file);
                    count++;
                });
                callback({filesNames: allFilesName});
            },
        ], function(result) {
            if (req.body.photos.length + count > 5) {
                callback({status:'You already have 5 photos. Delete some photos to upload new.'});
            } else {
                for (j = 0; j < result.filesNames.length; j++) {
                    for (var i = 0; i < req.body.photos.length; i++) {
                        if (req.body.photos[i].fileName == result.filesNames[j])
                            req.body.photos.splice(i, 1);
                    }
                }
                callback(req.body.photos.length == 0 ? {status:'This photos already uploaded.'} : true);
            }
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
                            callback({status:true});
                        });
                    });
                } else {
                    callback({status:true});
                }
            });
        });
    }
}

/*
 *  [function uploadUserAvatar]
 *  Обновляет фотографии пользователя. Если количество новых фото + количество
 *  старых больше 4 старые оно заменит на новые фото.
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

    checkUserFiles(req, function (result) {
        if (result == true) {
            var buff = new Buffer(req.body.photo.src
                .replace(/^data:image\/(png|gif|jpeg);base64,/,''), 'base64');
            fs.writeFile(dirPath + req.body.photo.name, buff, function (err) {
                if (err) throw err;
            });
            insertUserAvatar(req, callback);
        } else {
            callback(result);
        }
    });

    function checkUserFiles (req, callback) {
        var dirPath     = 'public/images/userPhotos/' + req.session.user_key + '/';
        var fs = require('fs');
        var count = 0;
        var allFilesName = [];

        async.series([
            function (callback) {
                fs.readdirSync(dirPath).forEach(function (file) {
                    allFilesName.push(file);
                    count++;
                });
                callback({filesNames: allFilesName});
            },
        ], function(result) {
            if (1 + count > 5) {
                console.log('too many files');
                callback({status:'You already have 5 photos. Delete some photos to upload new.'});
            } else {
                for (j = 0; j < result.filesNames.length; j++) {
                    if (req.body.photo.name == result.filesNames[j]) {
                        callback({status: 'This photo already uploaded'});
                        return ;
                    }
                }
                callback(req.body.photos && req.body.photos.length == 0 ? {status:'This photos already uploaded.'} : true);
            }
        });
    }

    function insertUserAvatar (req, callback) {
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
                        req.session.avatar_activated = req.body.photo.name;
                        sql = "INSERT INTO `active_users` SET `user_key` = ?, `activated` = 1";
                        con.query(sql, [req.session.user_key], function (err, result, fields) {
                            if (err) throw err;
                            callback({status:true});
                        });
                    });
                }
            });
        });
    }
}

/*
 *  [function deleteUserPhotos]
 *  Функция удаляет фотографии пользователя. Удаляет из папки, таблицы photos,
 *  photo_likes, comments и registered_users если эта фотография была аватаром
 *  пользователя, вместо нее ставится фотография unknown.jpg. Если пользователь
 *  удалит все свои фотографии он не удаляется из таблицы активных пользоватеелей.
 *
 *  res                     - Не используем.
 *  callback                - Возвращает true фото удалено, false в случае ошибки.
 */

module.exports.deleteUserPhotos = function (req, res, callback) {
    console.log('[SERVER] -> deleteUserPhotos'); //delete
    console.log(req.body.photos); //delete

    var con = mysql.createConnection(connData);
    con.connect(function(err) {
        if (err) throw err;
        console.log(req.body);
        var values = [];
        var sql = "DELETE FROM photos WHERE";
        var sql2 = '';
        for (var i = 0, j = 0; i < req.body.photos.length; i++, j+=2) {
            sql2            += " (photo_name = ? AND user_key = ?) " + (i + 1 < req.body.photos.length ? ' OR ' : '');
            values[j]       = req.body.photos[i];
            values[j + 1]   = req.session.user_key;
            if (req.body.photos[i] == req.session.avatar_activated)
                deleteAvatar(req, i);
            deleteFile(req, i);
        }
        con.query(sql + sql2, values, function (err, result, fields) {
            if (err) throw err;
            sql = "DELETE FROM photo_likes WHERE";
            con.query(sql + sql2, values, function (err, result, fields) {
                if (err) throw err;
                sql = "DELETE FROM comments WHERE";
                con.query(sql + sql2, values, function (err, result, fields) {
                    if (err) throw err;
                    callback(true);
                });
            });
        });
    });

    function deleteFile (req, i) {
        console.log('[i] : ', i);
        fs.stat('public/images/userPhotos/'+req.session.user_key+'/'+req.body.photos[i], function (err, stats) {
            if (err) return console.error(err);
            fs.unlink('public/images/userPhotos/'+req.session.user_key+'/'+req.body.photos[i],function(err){
                if(err) return console.log(err);
            });
        });
    }

    function deleteAvatar (req, i) {
        var sql = "UPDATE `registered_users` SET `photo_activated` = 0 WHERE `user_key` = ?"
        con.query(sql, [req.session.user_key], function (err, result, fields) {
            if (err) throw err;
            req.session.avatar_activated = 0;
        });
    }
}

/*
 *  [function setNewComment]
 *  Функция загружает новый коментарий к фотографии.
 *
 *  req.comment             - Обьект со всеми данными кроме отправителя коментария.
 *  req.comment.text        - Текст коментария.
 *  req.comment.to          - Какому пользователю адресуется коментарий.
 *  req.coment.photo        - К какой фотографии пользователя присвоить комментарий.
 *  res                     - Не используем.
 *  callback                - Возвращает true фото удалено, false в случае ошибки.
 */

module.exports.setNewComment = function (req, res, callback) {
    console.log('[SERVER] -> setNewComment')
    var con = mysql.createConnection(connData);
    con.connect(function(err) {
        if (err) throw err;
        console.log(req.body);
        var values = {
            photo_name          : req.body.comment.photo,
            comment             : req.body.comment.text,
            comentator_key      : req.session.user_key,
            comentator_full_name: req.body.comment.comentatorFullName,
            user_key            : req.body.comment.to
        };
        var sql = "INSERT INTO comments SET ?";
        con.query(sql, values, function (err, result, fields) {
            if (err) throw err;
            console.log(result);
            callback(result.affectedRows > 0 ? values : false);
        });
    });
}

/*
 *  [function getPhotoData]
 *  Функция подгружает все данные о фото, имя владельца, кол-во лайков и список
 *  коментариев у данной фотографии.
 *
 *  req.photo.name          - Имя фотографии.
 *  req.photo.owner         - Имя Владельца фотографии.
 *  res                     - Не используем.
 *  callback                - Возвращает true фото удалено, false в случае ошибки.
 */

module.exports.getPhotoData = function (req, res, callback) {
    console.log('[SERVER] -> getPhotoData')
    var con = mysql.createConnection(connData);
    con.connect(function(err) {
        if (err) throw err;
        console.log(req.body.photo);
        var values = [
            req.body.photo.name,
            req.body.photo.name,
            req.body.photo.owner
        ];
        var sql = "SELECT registered_users.name, registered_users.surname, registered_users.photo_activated, comments.comment, comments.comentator_key, comments.comentator_full_name, comments.comment_date, photos.likes  FROM registered_users "+
            "LEFT JOIN comments "+
            "ON (registered_users.user_key = comments.user_key AND comments.photo_name = ?) "+
            "LEFT JOIN photos "+
            "ON (photos.user_key = registered_users.user_key AND photos.photo_name = ?) "+
            "WHERE "+
            "registered_users.user_key = ? ";
        con.query(sql, values, function (err, result, fields) {
            if (err) throw err;

            console.log(result[0]);
            if (result[0]) {
                var e  = {
                    photo: {
                        avatar  : result[0].photo_activated,
                        owner   : result[0].name + ' ' + result[0].surname,
                        likes   : result[0].likes
                    },
                    comments: []
                };
                sql = "SELECT user_key, photo_activated FROM registered_users WHERE "
                var s2 = '';
                for (var i = 0; i < result.length; i++) {
                    e.comments[i] = {
                        comment             : result[i].comment,
                        comentatorKey       : result[i].comentator_key,
                        comentatorFullName  : result[i].comentator_full_name,
                        commentDate         : result[i].comment_date
                    };
                    s2+="user_key = '" + result[i].comentator_key + "'";
                    i + 1 < result.length ? s2 += ' OR ' : 0;
                }
                con.query(sql + s2, function (err, result, fields) {
                    for (var i = 0; i < e.comments.length; i++)
                        for (var j = 0; j < result.length; j++) {
                            if (result[j].user_key == e.comments[i].comentatorKey) {
                                e.comments[i].comentatorAvatar = 'images/userPhotos/'+result[j].user_key+'/'+result[j].photo_activated;
                                break ;
                            }
                        }
                    callback(e);
                });
            } else callback(null);
        });
    });
}

/*
 *  [function like]
 *  Функция получает имя фотографии и ключ владельца фотографии, после чего
 *  проверяет стоит ли лайк у этой фотографии от пользователя чей ключ в данный
 *  момент записаный в сессии.
 *
 *  Если стоит мы удаляем лайк из 'photo_likes' и минусуем кол-во лайков у данной
 *  фотографии в 'photos' и возвращаем 'delete'.
 *
 *  Если лайк не стоит  мы добавляем его в таблицу 'photo_likes', и плюсуем кол-во
 *  лайков у данной фотографии в 'photos' и возвращаем 'add'.
 *
 *  req.like.img            -   Название фотграфии которой поставлен лайк.
 *  req.like.imgOwner       -   Ключ пользователя фотографии.
 *  res                     -   Не используем.
 *  callback                -   Возвращает 'add' или 'delete' в зависимости от того
 *                              стоял лайк или нет.
 */

module.exports.like = function (req, res, callback) {
    var con = mysql.createConnection(connData);
    con.connect(function(err) {
        if (err) throw err;
        var values = [
            req.session.user_key,
            req.body.like.imgOwner,
            req.body.like.img
        ];
        var sql = "SELECT photos.likes, photo_likes.id FROM photos "+
                "LEFT JOIN photo_likes "+
                "ON (photos.user_key = photo_likes.user_key "+
                "AND photos.photo_name = photo_likes.photo_name " +
                "AND photo_likes.liker_key = ?) "+
                "WHERE photos.user_key = ? "+
                "AND photos.photo_name = ? ";

        con.query(sql, values, function (err, result, fields) {
            if (err) throw err;
            console.log(result);
            if (result[0].id != null) {
                deleteLike(req, values, result[0].likes, callback);
            } else {
                addLike(req, values, result[0].likes, callback);
            }

        });
    });

    function deleteLike (req, values, likes, callback) {
        console.log('DELETE LIKE\n');
        console.log(values);
        var sql = "DELETE FROM photo_likes WHERE " +
            "liker_key = ? AND user_key = ? AND photo_name = ?";
        con.query(sql, values, function (err, result, fields) {
            if (err) throw err;
            sql = "UPDATE photos SET likes = ? WHERE " +
                "user_key = ? AND photo_name = ?";
            con.query(sql, [likes-1, values[1], values[2]], function (err, result, fields) {
                if (err) throw err;
                callback({like: 'delete'});
            });
        });
    }

    function addLike (req, values, likes, callback) {
        console.log('ADD LIKE\n');
        console.log(values);
        var sql = "INSERT INTO photo_likes (liker_key, user_key, photo_name) VALUES (?, ?, ?)";
        con.query(sql, values, function (err, result, fields) {
            if (err) throw err;
            sql = "UPDATE photos SET likes = ? WHERE " +
                "user_key = ? AND photo_name = ?";
            con.query(sql, [likes+1, values[1], values[2]], function (err, result, fields) {
                if (err) throw err;
                callback({like: 'add'});
            });
        });
    }
}
