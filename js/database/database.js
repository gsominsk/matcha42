class DB {
	constructor() {
		this.argv 		= require('optimist').argv;
		this.mysql 		= require('mysql');
		this.host 		= 'localhost';
		this.user 		= 'root';
		this.password 	= '';
		this.database 	= 'matcha';
    }
}

class DropDatabase extends DB {
    constructor () {
        super();
        var con = this.mysql.createConnection({
            host: this.host,
            user: this.user,
            password: this.password
        });

        con.connect(function(err) {
            if (err) throw err;
            console.log("Connected!");
            con.query("DROP DATABASE IF EXISTS matcha", function (err, result) {
                if (err) throw err;
                console.log("Database dropped");
                con.end();
            });
        });
    }
}

class CreateDatabase extends DB {
	constructor () {
        super();
        var __this = this;

		var connectToMysql = this.mysql.createConnection({
			host	:this.host,
			user	:this.user,
			password:this.password
		});

		connectToMysql.connect(function(err) {
			if (err) throw err;
			console.log("Connected!");
			connectToMysql.query("CREATE DATABASE IF NOT EXISTS matcha", function (err, result) {
				if (err) throw err;
				console.log("Database created");
				__this.createTable();
				connectToMysql.end();
			});
		});
	}

	createTable () {
		console.log('Creatig tables');
		var connectToDatabase = this.mysql.createConnection({
			host	:this.host,
			user	:this.user,
			password:this.password,
			database:this.database
		});

		connectToDatabase.connect(function (err) {
			if (err) throw err;
			console.log('connected!');
			for (var i = 0; i < sqlTables.length; i++) {
				console.log((i < 11 ? 'Table ' : 'Key ')+': '+sqlTables[i].match(/\`\w+\`/i)+' created');
				connectToDatabase.query(sqlTables[i], function (err, result) {
					if (err) throw err;
				});
			}
			connectToDatabase.end();
		});
	}

}

var database = new DB;
var db;

if (database.argv.create && !database.argv.delete) {
    db = new CreateDatabase;
} else if (database.argv.delete && !database.argv.create) {
    db = new DropDatabase;
} else {
	console.log('Please choose one of flags [ --create or --delete ]');
}

var sqlTables = [];

sqlTables[0]  =		"CREATE TABLE `registered_users` ("+
						"`id` INT AUTO_INCREMENT,"+
						"`email` VARCHAR(256) DEFAULT 'null',"+
						"`key` VARCHAR(256) DEFAULT 'null',"+
						"`pass` VARCHAR(256) DEFAULT 'null',"+
						"`birthdate` DATE NOT NULL,"+
						"`sex` VARCHAR(128),"+
						"`sex_orientation` VARCHAR(128),"+
						"`country` VARCHAR(256),"+
						"`city` VARCHAR(256),"+
						"`famous` INT(32),"+
						"`photo_activated` VARCHAR(256) DEFAULT 'null',"+
						"`activated` BOOLEAN DEFAULT '0',"+
						"PRIMARY KEY (`id`)"+
					");";
sqlTables[1]  =		"CREATE TABLE `active_users` ("+
						"`key` VARCHAR(256) NOT NULL,"+
						"`activated` BOOLEAN NOT NULL DEFAULT '0'"+
					");";
sqlTables[2]  =		"CREATE TABLE `photos` ("+
						"`photo_name` VARCHAR(256),"+
						"`key` VARCHAR(256),"+
						"`likes` INT(8) NOT NULL DEFAULT '0',"+
						"`photo_date` DATETIME NOT NULL"+
					");";
sqlTables[3]  =		"CREATE TABLE `photo_likes` ("+
						"`photo_name` VARCHAR(256) NOT NULL,"+
						"`liker_key` VARCHAR(256) NOT NULL"+
					");";
sqlTables[4]  =		"CREATE TABLE `comments` ("+
						"`photo_name` VARCHAR(256) NOT NULL,"+
						"`comment` VARCHAR(1000) NOT NULL,"+
						"`comentator` VARCHAR(256) NOT NULL,"+
						"`comment_date` DATETIME NOT NULL"+
					");";
sqlTables[5]  =		"CREATE TABLE `user_chats` ("+
						"`key` VARCHAR(256) DEFAULT 'null',"+
						"`chat` VARCHAR(256) DEFAULT 'null',"+
						"`interlocutor_key` VARCHAR(256) DEFAULT 'null'"+
					");";
sqlTables[6]  =		"CREATE TABLE `chat_messages` ("+
						"`chat` VARCHAR(256),"+
						"`message` VARCHAR(2000),"+
						"`message_date` DATETIME NOT NULL,"+
						"`readed` BOOLEAN DEFAULT '0'"+
					");";
sqlTables[7]  =		"CREATE TABLE `user_hobbies` ("+
						"`key` VARCHAR(256),"+
						"`hobbie` VARCHAR(500)"+
					");";
sqlTables[8]  =		"CREATE TABLE `user_friends` ("+
						"`key` VARCHAR(256),"+
						"`friend_key` VARCHAR(256)"+
					");";
sqlTables[9]  =		"CREATE TABLE `user_blacklist` ("+
						"`key` VARCHAR(256),"+
						"`unwanted_user_key` VARCHAR(256)"+
					");";
sqlTables[10] =		"CREATE TABLE `unwanted_users` ("+
						"`unwanted_user_key` VARCHAR(256)"+
					");";
sqlTables[11] =		"ALTER TABLE `active_users` ADD CONSTRAINT `active_users_fk0` FOREIGN KEY (`key`) REFERENCES `registered_user`(`key`);";
sqlTables[12] =		"ALTER TABLE `photos` ADD CONSTRAINT `photos_fk0` FOREIGN KEY (`key`) REFERENCES `active_users`(`key`);";
sqlTables[13] =		"ALTER TABLE `photo_likes` ADD CONSTRAINT `photo_likes_fk0` FOREIGN KEY (`photo_name`) REFERENCES `photos`(`photo_name`);";
sqlTables[14] =		"ALTER TABLE `comments` ADD CONSTRAINT `comments_fk0` FOREIGN KEY (`photo_name`) REFERENCES `photos`(`photo_name`);";
sqlTables[15] =		"ALTER TABLE `user_chats` ADD CONSTRAINT `user_chats_fk0` FOREIGN KEY (`key`) REFERENCES `active_users`(`key`);";
sqlTables[16] =		"ALTER TABLE `chat_messages` ADD CONSTRAINT `chat_messages_fk0` FOREIGN KEY (`chat`) REFERENCES `user_chats`(`chat`);";
sqlTables[17] =		"ALTER TABLE `user_hobbies` ADD CONSTRAINT `user_hobbies_fk0` FOREIGN KEY (`key`) REFERENCES `active_users`(`key`);";
sqlTables[18] =		"ALTER TABLE `user_friends` ADD CONSTRAINT `user_friends_fk0` FOREIGN KEY (`key`) REFERENCES `active_users`(`key`);";
sqlTables[19] =		"ALTER TABLE `user_blacklist` ADD CONSTRAINT `user_blacklist_fk0` FOREIGN KEY (`key`) REFERENCES `active_users`(`key`);";
sqlTables[20] =		"ALTER TABLE `unwanted_users` ADD CONSTRAINT `unwanted_users_fk0` FOREIGN KEY (`unwanted_user_key`) REFERENCES `user_blacklist`(`unwanted_user_key`);";
