var mysql   = require('mysql');
var fs      = require('fs');
var async   = require('async');
var _users  = {};

var pool  = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "",
    database: "matcha",
    charset	: "utf8_general_ci"
});

module.exports.logout = function (req, res, callback) {
    delete req.session.avatar_activated;
    delete req.session.user_key;
    callback(true);
}

/*
*   [function addUserToStream] & [function deleteUserFromStream]
*   Во время входа пользователя на сайт мы записываем его в глобадбный
*   массив активных пользователей, при выходе из сайта или закрытии
*   странички пользователь удаеляется из этого списка.
*
*   req - нужен для получения ключа пользователя.
*   res - не используем.
*/

module.exports.addUserToStream = function (req, res) {
    if (req.session.user_key) {
        _users[req.session.user_key] = {
            user_key    : req.session.user_key,
        };
    }
    console.log(_users)
}

module.exports.deleteUserFromStream = function (req, res) {
    if (req.session.user_key) {
        delete _users[req.session.user_key];
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
    console.log('[getProfileData]');
    var body = req.body;
    pool.getConnection(function(err, con) {
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
                    if (req.session.user_key != values.user_key) {
                        updateUserFamous(req, con, result[0], function () {
                            con.release();
                            callback(result[0]);
                        });
                    } else {
                        con.release();
                        callback(result[0]);
                    }

                });
            } else {
                con.release();
                callback(null);
            }
        });
    });

    function updateUserFamous (req, con, data, callback) {
        var sql = "UPDATE registered_users SET ? WHERE user_key = ?";
        con.query(sql, [{famous: data.famous + 1}, data.user_key], function (err, result, fields) {
            if (err) throw err;
            getAdditionalInfo(req, con, data, function () {
                callback();
            });
        });
    }

    function getAdditionalInfo (req, con, data, callback) {
        async.parallel([
            function (callback) {
                var sql =   "SELECT t1.user_key, t2.liker_key FROM photo_likes t1 "+
                            "JOIN photo_likes t2 "+
                            "ON "+
                            "(t1.user_key = t1.user_key AND t1.liker_key = t1.liker_key) "+
                            "AND "+
                            "(t2.user_key = t1.liker_key AND t2.liker_key = t1.user_key) "+
                            "WHERE "+
                            "t1.user_key = ? "+
                            "AND "+
                            "t1.liker_key = ? ";
                con.query(sql, [req.session.user_key, data.user_key], function (err, result, fields) {
                    if (err) throw err;
                    callback(null, result[0] ? {liked: true} : {liked: false});
                });
            },
            function (callback) {
                var sql =   "SELECT user_key FROM user_friends "+
                            "WHERE "+
                            "user_key = ? "+
                            "AND "+
                            "friend_key = ? "

                con.query(sql, [req.session.user_key, data.user_key], function (err, result, fields) {
                    if (err) throw err;
                    callback(null, result[0] ? {friends: true} : {friends: false});
                });
        }
        ], function (err, result) {
            data.friends= result[1].friends;
            data.liked  = result[0].liked;
            callback(data);
        });
    }
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
    pool.getConnection(function(err, con) {
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
                    con.release();
                    callback(result)
                });
            } else {
                con.release();
                callback(null);
            }
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
    pool.getConnection(function(err, con) {
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
            con.release();
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

        pool.getConnection(function(err, con) {
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
                            con.release();
                            callback({status:true});
                        });
                    });
                } else {
                    con.release();
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
        pool.getConnection(function(err, con) {
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
                            con.release();
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

    pool.getConnection(function(err, con) {
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
                deleteAvatar(req, i, con);
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
                    con.release();
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

    function deleteAvatar (req, i, con) {
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
    pool.getConnection(function(err, con) {
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
            con.release();
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
    pool.getConnection(function(err, con) {
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
                                if (result[j].photo_activated != 0)
                                    e.comments[i].comentatorAvatar = 'images/userPhotos/'+result[j].user_key+'/'+result[j].photo_activated;
                                else
                                    e.comments[i].comentatorAvatar = 0;
                                break ;
                            }
                        }
                    con.release();
                    callback(e);
                });
            } else {
                con.release();
                callback(null);
            }
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
    pool.getConnection(function(err, con) {
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
                deleteLike(req, values, result[0].likes, con, callback);
            } else {
                addLike(req, values, result[0].likes, con, callback);
            }

        });
    });

    function deleteLike (req, values, likes, con, callback) {
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
                con.release();
                callback({like: 'delete'});
            });
        });
    }

    function addLike (req, values, likes, con, callback) {
        console.log('ADD LIKE\n');
        console.log(values);
        var sql = "INSERT INTO photo_likes (liker_key, user_key, photo_name) VALUES (?, ?, ?)";
        con.query(sql, values, function (err, result, fields) {
            if (err) throw err;
            sql = "UPDATE photos SET likes = ? WHERE " +
                "user_key = ? AND photo_name = ?";
            con.query(sql, [likes+1, values[1], values[2]], function (err, result, fields) {
                if (err) throw err;
                con.release();
                callback({like: 'add'});
            });
        });
    }
}

/*
 *  [function updateUserInfo]
 *
 *  Функция получает данные о пользователе которые надо изменить. Получив данные
 *  функция составляет запрос, так как надо изменить НЕКОТОРЫЕ данные а не все, хотя
 *  полльзователь при желании может изменить и все данные, после чего обновлет данные.
 *
 *  req.data                -   Обьект с данными о пользователе которые надо изменить.
 *  res                     -   Не используем.
 *  callback                -   Возвращает все измененные поля в таблице.
 */

module.exports.updateUserInfo = function (req, res, callback) {
    pool.getConnection(function(err, con) {
        if (err) throw err;
        var values = [
            req.body.data,
            req.session.user_key
        ];
        var sql = "UPDATE registered_users SET ? WHERE user_key = ?";

        con.query(sql, values, function (err, result, fields) {
            console.log(result);
            con.release();
            callback(req.body.data);
        });
    });
}

/*
 *  [function deleteHobbie]
 *
 *  Функция удаляет хобби (хештеги) пользователя, за раз может прийти не больше одного
 *  хештега. Если у пользователя есть несколько одинаковых хобби удалит первое в таблице,
 *  роли вообще не играет.
 *
 *  req.hobbie.name         -   Обьект с данными о пользователе которые надо изменить.
 *  res                     -   Не используем.
 *  callback                -   Возвращает 'status:true' если хештег удалился,
 *                              'status:false' если произошл ошибка.
 */

module.exports.deleteHobbie = function (req, res, callback) {
    console.log('[SERVER] -> deletePhoto');
    console.log(req.body);
    pool.getConnection(function(err, con) {
        if (err) throw err;
        var values = [
                req.body.hobbie.name,
                req.session.user_key
        ];
        var sql = "DELETE FROM user_hobbies WHERE hobbie = ? AND user_key = ?";
        con.query(sql, values, function (err, result, fields) {
            console.log(result);
            con.release();
            callback({status:true});
        });

    });
}

/*
 *  [function getBlackList]
 *
 *  Функция вытаскивает всех пользователей в черном списке у пользователя ключ которого
 *  записанный в сессии, если черный лист пользователя пустой, возвращает пустой массив.
 *
 *  req                     -   Не используем.
 *  res                     -   Не используем.
 *  callback                -   Возвращает пустой/заполненый массив с пользователями.
 */

module.exports.getBlackList = function (req, res, callback) {
    console.log('[SERVER] -> getBlackList');
    pool.getConnection(function(err, con) {
        if (err) throw err;
        var values = {
            user_key: req.session.user_key
        };
        var sql = "SELECT unwanted_user_key FROM user_blacklist WHERE ?";
        con.query(sql, values, function (err, result, fields) {
            console.log(result);

            if (result[0]) {
                for (var i = 0, keys = 'SELECT user_key, name, surname, photo_activated FROM registered_users WHERE '; i < result.length; i++) {
                    keys += ("user_key = '" + result[i].unwanted_user_key + "'" + (i + 1 < result.length ? " OR " : " "));
                }
                con.query(keys, function (err, result, fields) {
                    if (err) throw err;
                    for (var i = 0; i < result.length; i++) {
                        if (result[i].photo_activated != 0)
                            result[i].photo_activated = 'images/userPhotos/'+result[i].user_key+'/'+result[i].photo_activated;
                    }
                    con.release();
                    callback(result)
                });

            } else {
                con.release();
                callback(null);
            }
        });

    });
}

/*
 *  [function addUserToFriends]
 *
 *  Функция получает ключ пользователя которого надо добавить в друзья.
 *
 *  req                     -   Не используем.
 *  res                     -   Не используем.
 *  callback                -   Возвращает true.
 */

module.exports.addUserToFriends = function (req, res, callback) {
    console.log('[SERVER] -> addUserToFriends');
    pool.getConnection(function(err, con) {
        if (err) throw err;
        var values = {
            user_key    : req.session.user_key,
            friend_key  : req.body.user
        };
        var sql = "INSERT INTO user_friends SET ?";
        con.query(sql, values, function (err, result, fields) {
            console.log(result);
            con.release();
            callback(true);
        });

    });
}

/*
 *  [function addUserToFriends]
 *
 *  Функция удаляет пользователя из списка друзей пользователя чей ключ сейчас записан
 *  в сессии.
 *
 *  req.body.user           -   Пользователь которого надо удалить.
 *  res                     -   Не используем.
 *  callback                -   Возвращает true.
 */

module.exports.deleteFriend = function (req, res, callback) {
    console.log('[SERVER] -> addUserToFriends');
    pool.getConnection(function(err, con) {
        if (err) throw err;
        var values = {
            user_key    : req.session.user_key,
            friend_key  : req.body.user
        };
        var sql = "DELETE FROM user_friends WHERE user_key = ? AND friend_key = ?";
        con.query(sql, [values.user_key, values.friend_key], function (err, result, fields) {
            console.log(result);
            con.release();
            callback(true);
        });

    });
}

/*
 *  [function addToBlackList]
 *
 *  Функция удаляет пользователя из списка друзей пользователя чей ключ сейчас записан
 *  в сессии и записывает данного пользователя в черный список.
 *
 *  req.body.user           -   Пользователь которого надо удалить и закинуть в черный списко.
 *  res                     -   Не используем.
 *  callback                -   Возвращает true.
 */

module.exports.addToBlackList = function (req, res, callback) {
    console.log('[SERVER] -> addUserToFriends');
    pool.getConnection(function(err, con) {
        if (err) throw err;
        var values = {
            user_key    : req.session.user_key,
            friend_key  : req.body.user
        };
        async.parallel([
            function (callback) {
                var sql = "DELETE FROM user_friends WHERE user_key = ? AND friend_key = ?";
                con.query(sql, [values.user_key, values.friend_key], function (err, result, fields) {
                    if (err) throw err;
                    callback(null, true);
                });
            },
            function (callback) {
                var sql = "INSERT INTO user_blacklist SET ?";
                con.query(sql, {user_key:values.user_key, unwanted_user_key:values.friend_key}, function (err, result, fields) {
                    if (err) throw err;
                    callback(null, true);
                });
            }
        ], function (err, result) {
            if (err) throw err;
            con.release();
            callback(true);
        });
    });
}

/*
 *  [function removeFromBlackList]
 *
 *  Функция удаляет пользователя из черного списка пользователя чей ключ сейчас записан в сессии.
 *
 *  req.body.user           -   Ключ пользователя которого надо удалить из черного списка.
 *  res                     -   Не используем.
 *  callback                -   Возвращает true.
 */

module.exports.removeFromBlackList = function (req, res, callback) {
    console.log('[SERVER] -> removeFromBlackList');
    pool.getConnection(function(err, con) {
        if (err) throw err;
        var values = {
            user_key    : req.session.user_key,
            friend_key  : req.body.user
        };
        var sql = "DELETE FROM user_blacklist WHERE user_key = ? AND unwanted_user_key = ?";
        con.query(sql, [values.user_key, values.friend_key], function (err, result, fields) {
            console.log(result);
            con.release();
            callback(true);
        });

    });
}

/*
 *  [function findUsers]
 *
 *  Функция в зависимости от фильтров которые нам пришли, выбирает пользователей из базы данных.
 *
 *  req.body.options        -   Фильтры.
 *  res                     -   Не используем.
 *  callback                -   Список пользователей.
 */

module.exports.findUsers = function (req, res, callback) {
    console.log('[SERVER] -> findUser');
    pool.getConnection(function(err, con) {
        if (err) throw err;
        var sql = "SELECT latitude, longitude FROM registered_users WHERE user_key = ?";
        con.query(sql, [req.session.user_key], function (err, result, fields) {
            getUsers(req, result[0], function (users) {
                callback(users);
            });
        });

        function getUsers (req, coords, callback) {
            var sql = "SELECT user_key, name, surname, photo_activated FROM registered_users ";
            var sql2 = '';

            if (req.body.options.name.length > 0) {
                sql2.length == 0 ? sql2 += "WHERE " : 0;
                var names = req.body.options.name.split(' ');
                for (var i = 0; i < names.length; i++) {
                    if (names[i].trim().length == 0) {
                        i + 1 >= names.length ? sql2 += ' ) ' : 0;
                        continue ;
                    }
                    i == 0 ? sql2 += ' ( ' : 0;
                    sql2 += " name = '"+names[i]+"' ";
                    sql2 += " OR surname = '"+names[i]+"' ";
                    i + 1 < names.length  && names[i + 1].trim().length == 0 ? sql2 +=' OR ' : 0;
                    i + 1 >= names.length ? sql2 += ' ) ' : 0;
                }
            }
            if (req.body.options.sex != 'any') {
                sql2.length == 0 ? sql2 += "WHERE " : sql2 += " AND ";
                sql2 += "( sex = '"+req.body.options.sex+"' ) ";
            }
            if (req.body.options.sflCountry.trim().length > 0) {
                sql2.length == 0 ? sql2 += "WHERE " : sql2 += " AND ";
                sql2 += "( country = '"+req.body.options.sflCountry.trim()+"' ) ";
            }
            if (req.body.options.sflCity.trim().length > 0) {
                sql2.length == 0 ? sql2 += "WHERE " : sql2 += " AND ";
                sql2 += "( city = '"+req.body.options.sflCity.trim()+"' ) ";
            }

            sql2.length == 0 ? sql2 += "WHERE " : sql2 += " AND ";
            if (req.body.options.minAge > req.body.options.maxAge)
                sql2+= "(age >= '"+req.body.options.minAge+"')";
            else
                sql2+= "(age >= '"+req.body.options.minAge+"' AND age <= '"+req.body.options.maxAge+"')";

            sql2.length == 0 ? sql2 += "WHERE " : sql2 += " AND ";
            if (req.body.options.minFamous > req.body.options.maxFamous)
                sql2+= "(famous >= '"+req.body.options.minFamous+"')";
            else
                sql2+= "(famous >= '"+req.body.options.minFamous+"' AND famous <= '"+req.body.options.maxFamous+"')";

            sql2.length == 0 ? sql2 += "WHERE " : sql2 += " AND ";
            var l = (req.body.options.radius * 1000 * 10) / 1000000;
            var minLng = coords.longitude - l;
            var maxLng = coords.longitude + l;
            var minLat = coords.latitude - l;
            var maxLat = coords.latitude + l;

            sql2+= "(longitude > '"+minLng+"' AND  longitude < '"+maxLng+"' AND latitude > '"+minLat+"' AND latitude < '"+maxLat+"')";

            var check = 0;
            sql2.length == 0 ? sql2 += "WHERE " : sql2 += " AND ";
            sql2+= '( ';
            for (e in req.body.options.sexOrientation) {
                if (req.body.options.sexOrientation[e] == 1) {
                    check == 1 ? sql2+= " OR " : 0;
                    sql2+= " sex_orientation = '"+e+"' ";
                    check = 1;
                }
            }
            sql2+= ' )';

            console.log(sql + sql2);
            con.query(sql + sql2, [], function (err, result, fields) {
                console.log(result);
                callback(result ? result : []);
            });
        }
    });
}


/*
 *  [function getChats]
 *
 *  Функция вытаскивает все чаты по ключу пользователя в сессии.
 *
 *  req                     -   Не используем.
 *  res                     -   Не используем.
 *  callback                -   Возвращает true.
 */

// module.exports.getChats = function (req, res, callback) {
//     console.log('[SERVER] -> var sql');
//     pool.getConnection(function(err, con) {
//         if (err) throw err;
//         var values = {
//             user_key    : req.session.user_key,
//             friend_key  : req.body.user
//         };
//         var sql = "SELECT id, interlocutor_key FROM user_chats WHERE user_key = ?";
//         con.query(sql, [req.session.user_key], function (err, result, fields) {
//             console.log(result);
//             if (result[0])
//             async.parallel([
//                 function () {
//
//                 },
//                 function () {
//
//                 }
//             ], function () {
//
//             });
//             con.release();
//             callback(result[0]);
//         });
//
//     });
// }
