var _global             = {};

_global.user            = {};
_global.user.fullName   = '';
_global.user.avatar     = '';

_global.anotherUserPage         = {}
_global.anotherUserPage.userKey = null;

_global.chat                = {};
_global.chat.key            = '';
_global.chat.interlocutor   = '';

_global.vue         = {};
_global.vue.modal   = {};

_global.functions   = {
    normalize: function (str) {
        var div = document.createElement('div');
        var text = document.createTextNode(str);
        div.appendChild(text);
        return div.innerHTML;
    },
    playSound: function(filename) {
        document.getElementById("sound").innerHTML='<audio autoplay="autoplay"><source src="' + filename + '.mp3" type="audio/mpeg" /><source src="' + filename + '.ogg" type="audio/ogg" /><embed hidden="true" autostart="true" loop="false" src="' + filename +'.mp3" /></audio>';
    },
    scrollToBottom: function () {
        setTimeout(function () {
            var block = document.getElementsByClassName("chat-body")[0];
            block.scrollTop = block.scrollHeight;
        }, 100);
    }
};

_global.loadedObjects = {
    profile		:false,
    messages	:false,
    friends		:false,
    options		:false,
    search		:false,
    blacklist	:false,
    anotherUser	:false
};

_global.socket;

class MainProfile {
    constructor () {
        this.textareaAutoresize = new TextareaAutoresize;
        this.floatMenu = new FloatMenu(this);

        var __this = this;

        // this.startStream();
    }

    startStream () {
        var ajax = new Ajax;

        var ajaxReq = {
            type: 'POST',
            body: {
                action: 'addUserToStream'
            }
        };
        ajax.sendRequest('http://localhost:3000/profile', ajaxReq , function (data) {
            console.log(data ? data : 0);
        });
    }

    animationLoadingStart () {
        var load = document.getElementsByClassName('loading-window')[0];

        load.setAttribute('style', 'display:flex;');
        setTimeout(function () {
            load.setAttribute('style', 'opacity:1; display:flex;');
        }, 100);
    }

    animationLoadingEnd () {
        var load = document.getElementsByClassName('loading-window')[0];

        load.setAttribute('style', 'opacity:0; display:flex;');
        setTimeout(function () {
            load.setAttribute('style', '');
        }, 200);
    }

    addHandler(object, event, handler, useCapture) {
        if (object.addEventListener) {
            object.addEventListener(event, handler, useCapture ? useCapture : false);
        } else if (object.attachEvent) {
            object.attachEvent('on' + event, handler);
        } else alert("Add handler is not supported");
    }
}

class Chat extends MainProfile {
    constructor () {
		super();
		var block = document.getElementsByClassName("chat-body")[0];
		block.scrollTop = block.scrollHeight;

	}
}

class ProfilePage extends MainProfile {
	constructor () {
		super();
        _global.anotherUserPage.userKey = null;
		if (_global.loadedObjects.profile == false) {
            this.renderProfilePage();
            console.log('profile page loaded');
            _global.loadedObjects.profile = true;
		}
	}

	renderProfilePage () {
        var ajax = new Ajax;

        var __this = this;

        var ajaxReq = {
            type: 'POST',
            body: {
                action: 'getProfileData'
            }
        };
        ajax.sendRequest('http://localhost:3000/profile', ajaxReq , function (data) {
            __this.vueRenderStaticInfo(data);
            _global.user.fullName       = data.name + ' ' + data.surname;
            _global.user.key            = data.user_key;
            _global.user.avatar         = 'images/userPhotos/'+data.user_key+'/'+data.photo_activated;
            _global.user.name           = data.name;
            _global.user.surname        = data.surname;
            _global.user.country        = data.country;
            _global.user.city           = data.city;
            _global.user.email          = data.email;
            _global.user.age            = data.age;
            _global.user.sex            = data.sex;
            _global.user.sexOrientation = data.sex_orientation;

            _global.socket.emit('addToStream', {
                key     :data.user_key
            });

            if (data.photo_activated != 0) {
                _global.vue.profileMenu.avatar  = 'images/userPhotos/'+data.user_key+'/'+data.photo_activated;
                _global.vue.mobileProfileMenu.avatar  = 'images/userPhotos/'+data.user_key+'/'+data.photo_activated;
            }
            else {
                _global.vue.profileMenu.avatar = 'images/unknown.jpg';
                _global.vue.mobileProfileMenu.avatar = 'images/unknown.jpg';
            }
            _global.vue.changeUserData.user = data;
            document.querySelectorAll('input[value="'+data.sex_orientation+'"]')[0].checked = true;
            document.querySelectorAll('input[value="'+data.sex+'"]')[0].checked = true;

            console.log('data', data);
        });
    }

    vueRenderStaticInfo (data) {
        var __this = this;

        _global.vue.profileStatic.setUserInfo([
            {
                id: 1,
                describeItemClass: 'country-d',
                describeItemText: 'COUNTRY',
                valueItemClass: 'country',
                valueItemText: data.country
            },
            {
                id: 2,
                describeItemClass: 'city-d',
                describeItemText: 'CITY',
                valueItemClass: 'city',
                valueItemText: data.city
            },
            {
                id: 3,
                describeItemClass: 'aage-d',
                describeItemText: 'AGE',
                valueItemClass: 'aage',
                valueItemText: data.age
            },
            {
                id: 4,
                describeItemClass: 'sex-d',
                describeItemText: 'SEX',
                valueItemClass: 'sex',
                valueItemText: data.sex
            },
            {
                id: 5,
                describeItemClass: 'sex-orientation-d',
                describeItemText: 'SEX-ORIENTATION',
                valueItemClass: 'sex-orientation',
                valueItemText: data.sex_orientation
            },
            {
                id: 6,
                describeItemClass: 'email-d',
                describeItemText: 'EMAIL',
                valueItemClass: 'email',
                valueItemText: data.email
            }
        ]);

        _global.vue.profileNameStatic.setUserName(data);

        _global.vue.profileHobbies.setUserHobbies(data);

        _global.vue.aboutYourself.setAboutYourself(data);

        _global.vue.userPhotos.setUserPhotos(data);
    }
}

class MessagesPage extends MainProfile {
	constructor () {
        console.log('class MaeesagesPage created!');

        super();
		this.chat           = document.getElementsByClassName('chat-wrap')[0];
		this.closeChatBtn   = document.getElementsByClassName('close-chat-btn')[0];

		var __this          = this;

		// open/close
        this.addHandler(document, 'click', function () {
            if (event.target.hasAttribute('user') && event.target.classList.contains('pcl-item')) {
                _global.chat.key            = event.target.getAttribute('chat');
                _global.chat.interlocutor   = event.target.getAttribute('user');
                __this.openChat();
            } else if (event.target.classList.contains('time-of-last-message')
                || event.target.classList.contains('last-message-of-chat')
                || event.target.classList.contains('interlocutor-img-wrap')
                || event.target.classList.contains('interlocutor-name')) {
                _global.chat.key            = event.target.parentElement.getAttribute('chat');
                _global.chat.interlocutor   = event.target.parentElement.getAttribute('user');
                __this.openChat();
            }
        });

        this.addHandler(document, 'click', function () {
            if (event.target.hasAttribute('user')) {
                _global.anotherUserPage.userKey = event.target.getAttribute('user');
            } else if (event.target.classList.contains('interlocutor-info-wrap')
                || event.target.classList.contains('chat-interlocutor-name')) {
                _global.anotherUserPage.userKey = event.target.parentElement.getAttribute('user');
            } else if (event.target.hasAttribute('alt')) {
                var el = event.target.getAttribute('alt').toString();
                el == "interlocutorAvatar" ? _global.anotherUserPage.userKey = event.target.parentElement.parentElement.getAttribute('user') : 0;
            }
        });

        this.addHandler(this.closeChatBtn, 'click', function () {
            __this.closeChat();
        });

		this.renderChats();

	}

	closeChat() {
        _global.vue.chatsList.messages              = [];
        _global.vue.chatsList.interlocutor.name     = '';
        _global.vue.chatsList.interlocutor.key      = '';
        _global.vue.chatsList.interlocutor.avatar   = '';
        this.chat.removeAttribute('style');
	}

	openChat () {
		this.chat.setAttribute('style', 'left:0;');
		var __this = this;
		var ajax = new Ajax;
		var ajaxReq = {
		    type: 'POST',
            body: {
		        action      : 'getMessages',
                chat        : _global.chat.key,
                interlocutor: _global.chat.interlocutor
            }
        };
		ajax.sendRequest('/profile', ajaxReq, function (data) {
            if (data[1]) {
                _global.vue.chatsList.interlocutor.name     = data[1].name + " " + data[1].surname;
                _global.vue.chatsList.interlocutor.key      = data[1].user_key;
                _global.vue.chatsList.interlocutor.avatar   = data[1].photo_activated == '0' ? 'images/unknown.jpg'
                                                            : 'images/userPhotos/'+_global.chat.interlocutor+'/'+data[1].photo_activated;
            }
            if (data[0]) {
                for (var i = 0; i < data[0].length; i++)
                    data[0][i].user_key = data[0][i].msgOwner == _global.user.key ? 'left-message' : 'right-message';
                _global.vue.chatsList.messages = data[0];
            }
            _global.functions.scrollToBottom();
        });
	}

	renderChats() {
	    var __this = this;
        var ajax = new Ajax;
        var ajaxReq = {
            type: 'POST',
            body: {
                action: 'getChats'
            }
        }
        ajax.sendRequest('http://localhost:3000/profile', ajaxReq, function (data) {
            console.log(data);
            __this.createChats(data);
        });
    }

    createChats (data) {
	    var chats = [];
	    var flag = 0;
        for (var i = 0; i < data[2].length; i++) {
            for (var j = 0; j < data[1].length; j++) {
                for (var k = 0; k < data[0].length; k++) {
                    if (data[2][i].chat == data[0][k].chat && data[2][i].interlocutor_key == data[1][j].user_key) {
                        flag = 1;
                        this.pushNewChat(chats, data, i, j, k);
                        k = 0;
                        j = 0;
                    }
                }
                if (flag == 0) {
                    data[0][data[0].length] = {
                        chat        : data[2][i].chat,
                        message     : 'no massages yet.',
                        readed      : 1,
                        message_date: new Date()
                    };
                    flag = 1;
                    this.pushNewChat(chats, data, i, j, data[0].length - 1);
                    k = 0;
                    j = 0;
                }

            }
        }
        _global.vue.chatsList.chats = chats;
    }

    pushNewChat (chats, data, i, j, k) {
	    var date = new Date(data[0][k].message_date);
        chats[i] = {};
        chats[i].chat           = data[0][k].chat;
        chats[i].message        = data[0][k].message;
        chats[i].readed         = data[0][k].readed == 1 ? null : 'not-readed';
        chats[i].message_date   = (date.getMonth() + 1) +'/'+date.getDate()+'/'+date.getFullYear()+' '+date.getHours()+':'+date.getMinutes();
        chats[i].user_key       = data[1][j].user_key;
        chats[i].name           = data[1][j].name;
        chats[i].surname        = data[1][j].surname;
        chats[i].photo_activated= data[1][j].photo_activated != '0' ? 'images/userPhotos/'+data[1][j].user_key+'/'+data[1][j].photo_activated : '0';
        data[0].splice(k, 1);
        data[1].splice(j, 1);
    }
}

class FriendsPage extends MainProfile {
	constructor () {
		super();

		this.friendsList = document.getElementsByClassName('friends-list-wrap')[0];

        this.getFriendsList();
	}

    getFriendsList () {
        var ajax = new Ajax;

        var __this = this;

        var ajaxReq = {
            type: 'POST',
            body: {
                action: 'getFriendsList'
            }
        };
        ajax.sendRequest('http://localhost:3000/profile', ajaxReq, function (data) {
            _global.vue.friendsList.deleteAll();
            _global.vue.friendsList.addNewFriends(data);
            console.log(data);
        });

        this.addHandler(document, 'click', function () {
            if (event.target.hasAttribute('user'))
                _global.anotherUserPage.userKey = event.target.getAttribute('user');
            else if (event.target.classList.contains('friends-full-name')
                    || event.target.classList.contains('friend-img-wrap')) {
                _global.anotherUserPage.userKey = event.target.parentElement.getAttribute('user');
            } else if (event.target.hasAttribute('alt')) {
                var el = event.target.getAttribute('alt').toString();
                el == "friendsImg" ? _global.anotherUserPage.userKey = event.target.parentElement.parentElement.getAttribute('user') : 0;
            }
        });
    }

}

class OptionsPage extends MainProfile {
	constructor () {
		super();

		this.uploadPhotoBtn     = document.getElementsByClassName('click-to-upload-photo')[0];
		this.uploadPhoto        = document.querySelector('input[name=upload-user-photos]');
        this.uploadAvatarBtn    = document.getElementsByClassName('click-to-upload-avatar')[0];
        this.uploadAvatar       = document.querySelector('input[name=upload-user-avatar]');


		console.log('class OptionsPage created!');

		var __this = this;

        this.uploadAvatarBtn.onclick = function () {
            __this.uploadAvatar.click()
        }

        this.uploadAvatar.onchange = function () {
            _global.vue.addUserAvatar.addNewImg();
        }

		this.uploadPhotoBtn.onclick = function () {
            __this.uploadPhoto.click();
        }

        this.uploadPhoto.onchange = function () {
		    _global.vue.addUserPhoto.addNewImg();
        }

        _global.vue.optionsRenderPhotos.renderUserPhotos();

    }
}

class SearchPage extends MainProfile {
	constructor () {
		super();

		var __this = this;

        this.rangeSlider();

        _global.vue.filters.sflCountry = _global.user.country;
        _global.vue.filters.sflCity    = _global.user.city;

        this.addHandler(document, 'click', function () {
            if (event.target.hasAttribute('user')) {
                _global.anotherUserPage.userKey = event.target.getAttribute('user');
            } else if (event.target.classList.contains('founded-user-name')
                    || event.target.classList.contains('founded-user-img-wrap') ) {
                _global.anotherUserPage.userKey = event.target.parentElement.getAttribute('user');
            } else if (event.target.hasAttribute('alt')) {
                var el = event.target.getAttribute('alt').toString();
                el == "foundedUser" ? _global.anotherUserPage.userKey = event.target.parentElement.parentElement.getAttribute('user') : 0;
            }
        });

        console.log('class SearchPage created!');
	}

    rangeSlider () {
        var slider = $('.range-slider'),
            range = $('.range-slider__range'),
            value = $('.range-slider__value');

        slider.each(function(){

            value.each(function(){
                console.log('1');
                var value = $(this).prev().attr('value');
                // $(this).html(value);
            });

            range.on('input', function(){
                _global.vue.filters[this.name] = this.value;
                console.log(this.name);

                // $(this).next(value).html(this.value);
            });
        });
    };
}

class BlacklistPage extends MainProfile {
	constructor () {
		super();
		console.log('class BlacklistPage created!');

	    this.getBlackList();
	}

	getBlackList () {
        var ajax = new Ajax;

        var __this = this;

        var ajaxReq = {
            type: 'POST',
            body: {
                action: 'getBlackList'
            }
        };
        ajax.sendRequest('http://localhost:3000/profile', ajaxReq, function (data) {
            _global.vue.blackList.deleteAll();
            _global.vue.blackList.addNew(data);
            console.log(data);
        });

        this.addHandler(document, 'click', function () {
            if (event.target.hasAttribute('user')) {
                _global.anotherUserPage.userKey = event.target.getAttribute('user');
            } else if (event.target.classList.contains('bl-user-full-name')) {
                _global.anotherUserPage.userKey = event.target.parentElement.getAttribute('user');
            } else if (event.target.hasAttribute('alt')) {
                var el = event.target.getAttribute('alt').toString();
                el == "friendsImg" ? _global.anotherUserPage.userKey = event.target.parentElement.parentElement.getAttribute('user') : 0;
            }
        });
    }
}

class AnotherUserPage extends MainProfile {
	constructor () {
		super();

		this.addToFriends   = document.getElementsByClassName('add-to-friends')[0];
        this.sendMessage    = document.getElementsByClassName('send-message')[0];

		this.renderAnotherUserPage();

        _global.socket.emit('visit', {
            to      :_global.anotherUserPage.userKey,
            from    :_global.user.key
        });

		console.log('class AnotherUserPage created!');
	}

    renderAnotherUserPage () {
        var ajax = new Ajax;

        var __this = this;

        var ajaxReq = {
            type: 'POST',
            body: {
                action: 'getProfileData',
                user_key: _global.anotherUserPage.userKey
            }
        };
        ajax.sendRequest('http://localhost:3000/profile', ajaxReq , function (data) {
            _global.anotherUserPage.liked   = data.liked;
            _global.anotherUserPage.friends = data.friends;
            _global.vue.auBtns.liked = !data.liked;
            _global.vue.auBtns.friends = data.friends;
            __this.vueRenderAuProfileData(data);
        });
    }

    vueRenderAuProfileData (data) {
        _global.vue.auProfileName.setAuProfileName(data);

        _global.vue.auAvatarImg.setAuAvatarImg(data);

        _global.vue.auGalleryPhotos.setGalleryPhotos(data);

        _global.vue.auUserHobbies.setAuUserHobbies(data);

        _global.vue.auProfileStatic.setUserInfo([
            {
                id: 1,
                describeItemClass: 'au-country-d',
                describeItemText: 'COUNTRY',
                valueItemClass: 'au-country',
                valueItemText: data.country
            },
            {
                id: 2,
                describeItemClass: 'au-city-d',
                describeItemText: 'CITY',
                valueItemClass: 'au-city',
                valueItemText: data.city
            },
            {
                id: 3,
                describeItemClass: 'au-age-d',
                describeItemText: 'AGE',
                valueItemClass: 'au-age',
                valueItemText: data.age
            },
            {
                id: 4,
                describeItemClass: 'au-sex-d',
                describeItemText: 'SEX',
                valueItemClass: 'au-sex',
                valueItemText: data.sex
            },
            {
                id: 5,
                describeItemClass: 'au-sex-orientation-d',
                describeItemText: 'SEX-ORIENTATION',
                valueItemClass: 'au-sex-orientation',
                valueItemText: data.sex_orientation
            },
            {
                id: 6,
                describeItemClass: 'au-email-d',
                describeItemText: 'EMAIL',
                valueItemClass: 'au-email',
                valueItemText: data.email
            }
        ]);

        _global.vue.auAboutYourself.setAboutYourself(data);

    }
}

class VueUpload {
    constructor () {
        /* ========================= */
        /*         PROFILE           */
        /* ========================= */

        Vue.component('profile-static-info', {
            props: ['item'],
            template: '<div><span v-bind:class="item.describeItemClass">{{item.describeItemText}}</span><span v-bind:class="item.valueItemClass">{{item.valueItemText}}</span></div>'
        });

        Vue.component('gallery-user-photo', {
            props: ['item'],
            template: '<li class="gpl-item" data-toggle="modal" data-target="#galleryPhotosModal"><div class="gpl-img-wrap"><img v-bind:src="item" alt="user photo"></div></li>'
        });

        Vue.component('hl-item', {
            props: ['item'],
            template:   '<li class="hl-item">' +
            '{{item}}'+
            '<i class="fa fa-times" aria-hidden="true"></i>'+
            '</li>'
        });

        _global.vue.profileStatic = new Vue({
            el: '.profile-data-list',
            data: {
                profileStaticInfo: []
            },
            methods: {
                setUserInfo: function (data) {
                    this.profileStaticInfo = [];

                    for (var i = 0; i < data.length; i++) {
                        this.profileStaticInfo.push(data[i]);
                    }
                },
                deleteAll: function () {
                    this.profileStaticInfo = [];
                }
            }
        });

        _global.vue.profileNameStatic = new Vue({
            el: '.profile-name',
            data: {
                name: '',
                surname: ''
            },
            methods: {
                setUserName: function (data) {
                    this.name   = data.name ? data.name : 'emptyName';
                    this.surname= data.surname ? data.surname : 'emptySurname';;
                }
            }
        });

        _global.vue.profileHobbies = new Vue({
            el: '.hobbies-list',
            data: {
                hobbies: ['#no_hashtags_yet']
            },
            methods : {
                setUserHobbies: function (data) {
                    this.hobbies = data.hobbies.length == 0 ? ['#no_hashtags_yet'] : data.hobbies;
                },
                deleteHobbie: function () {
                    if (event.target.classList.contains('fa-times')) {
                        var nodes       = Array.prototype.slice.call( document.getElementsByClassName('hobbies-list')[0].children );
                        var hobbie      = event.target.parentElement.innerText;
                        var hobbieNum   = nodes.indexOf(event.target.parentElement)
                        var __this      = this;

                        console.log(hobbie);

                        var ajax = new Ajax;
                        var ajaxReq = {
                            type: 'POST',
                            body: {
                                action: 'deleteHobbie',
                                hobbie: {
                                    name: hobbie
                                }
                            }
                        }
                        ajax.sendRequest('http://localhost:3000/profile', ajaxReq, function (data) {
                            data.status == true ? __this.hobbies.splice(hobbieNum, 1) : 0;
                        });
                    }
                },
                deleteAll: function () {
                    this.hobbies = [];
                }
            }
        });

        _global.vue.aboutYourself = new Vue({
            el: document.querySelectorAll('textarea[name="about-yourself"]')[0],
            data: {
                aboutUser: 'Describe yourself and your hobbies'
            },
            methods: {
                setAboutYourself: function (data) {
                    this.aboutYourself = data.about_yourself == null ? 'Describe yourself and your hobbies' : data.about_yourself
                }
            }
        });

        _global.vue.userPhotos = new Vue({
            el  : '.gallery-photos-wrap',
            data: {
                photos: null
            },
            methods: {
                getPhotoData: function () {
                    _global.vue.auGalleryPhotos.getPhotoData();
                },
                setUserPhotos: function (data) {
                    this.photos = data.photos.length != 0 ? data.photos : null
                }
            }
        });

        /* ========================= */
        /*       PROFILEMENU         */
        /* ========================= */

        _global.vue.mobileProfileMenu = new Vue ({
            el  : document.querySelectorAll('.profile-menu')[0],
            data: {
                avatar: 'images/unknown.jpg',
                mCounter: 0
            },
            methods: {
                getPhotoData: function () {
                    _global.vue.auGalleryPhotos.getPhotoData();
                }
            }
        });

        _global.vue.profileMenu = new Vue ({
            el  : document.querySelectorAll('.profile-menu')[1],
            data: {
                avatar: 'images/unknown.jpg',
                mCounter: 0
            },
            methods: {
                getPhotoData: function () {
                    _global.vue.auGalleryPhotos.getPhotoData();
                }
            }
        });

        /* ========================= */
        /*      NOTIFICATIONS        */
        /* ========================= */

        Vue.component('notification', {
            props:['item'],
            template:   '<li class="nl-item-wrap">' +
                            '<div class="nl-item-container clearfix" data-target="#profileMainContentCarousel" data-slide-to="7" v-bind:user="item.user_key">' +
                                '<div class="nl-avatar-wrap">' +
                                    '<img v-bind:src="item.photo_activated"/>'+
                                '</div>' +
                                '<div class="nl-avatar-name">{{item.name}} {{item.surname}}</div>'+
                                '<div class="nl-item-message">{{item.msg}}</div>'+
                            '</div>'+
                            '<i class="fa fa-times" aria-hidden="true"></i>'+
                        '</li>'
        });

        _global.vue.notificationsList = new Vue ({
            el: '.notification-list',
            data: {
                notifications: []
            },
            methods: {
                deleteItem: function () {
                        var notif       = Array.prototype.slice.call( document.getElementsByClassName('notification-list')[0].children );
                        var parent;
                        var __this = this;

                        if (event.target.parentElement.classList.contains('nl-item-wrap')) {
                            parent = event.target.parentElement;
                        } else if (event.target.parentElement.parentElement.classList.contains('nl-item-wrap')) {
                            parent = event.target.parentElement.parentElement;
                        } else if (event.target.parentElement.parentElement.parentElement.classList.contains('nl-item-wrap')) {
                            parent = event.target.parentElement.parentElement.parentElement;
                        }
                        var notifNum    = notif.indexOf(event.target.parentElement)
                        _global.anotherUserPage.userKey = parent.childNodes[0].getAttribute('user');
                        console.log(parent.childNodes[0].getAttribute('user'));

                        parent.setAttribute('style', 'height:0;');
                        setTimeout(function () {
                            parent.removeAttribute('style');
                            __this.notifications.splice(notifNum, 1);
                        }, 300);
                }
            }
        });

        /* ========================= */
        /*        BLACKLIST          */
        /* ========================= */

        Vue.component('bl-item', {
            props:['item'],
            template:   '<li class="bl-item clearfix">'+
                            '<div class="blacklist-wrap" data-target="#profileMainContentCarousel" data-slide-to="7" v-bind:user="item.user_key">'+
                                '<div v-if="item.photo_activated != 0" class="bl-user-img-wrap"><img v-bind:src="item.photo_activated" alt=""/></div>'+
                                '<div v-else class="bl-user-img-wrap"><img src="images/unknown.jpg" alt=""/></div>'+
                                '<div class="bl-user-full-name">{{item.name}} {{item.surname}}</div>'+
                            '</div>'+
                            '<div class="bl-dropdown dropdown">'+
                                '<button id="blacklistUserDropdown" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" class="btn btn-secondary dropdown-toggle">' +
                                    '<i aria-hidden="true" class="fa fa-ellipsis-h"></i>' +
                                '</button>'+
                                '<div aria-labelledby="blacklistUserDropdown" class="dropdown-menu">' +
                                    '<a href="#" action="removeFromBlackList" class="dropdown-item">Remove from blacklist</a>' +
                                    // '<a href="#" class="dropdown-item">Complain user</a>' +
                                    // '<a href="#" class="dropdown-item">Fake account</a>' +
                                '</div>'+
                            '</div>'+
                        '</li>'
        });

        _global.vue.blackList = new Vue ({
            el: '.blacklist',
            data: {
                users: []
            },
            methods: {
                deleteAll: function () {
                    this.users = [];
                },
                addNew: function (users) {
                    if (!users) return;
                    for (var i = 0; i < users.length; i++) {
                        this.users.push(users[i]);
                    }
                },
                getAction: function () {
                    if (event.target.tagName == 'A') {
                        this.action = event.target.getAttribute('action');
                        this.friend =  event.target.parentElement.parentElement.previousSibling.getAttribute('user');
                        var __this  = this;
                        console.log(this.action, this.friend);

                        var ajax = new Ajax;
                        var ajaxReq = {
                            type: 'POST',
                            body: {
                                action  : this.action,
                                user    : this.friend
                            }
                        }
                        ajax.sendRequest('http://localhost:3000/profile', ajaxReq, function (data) {
                            for (var i = 0; i < __this.users.length; i++) {
                                if (__this.users[i].user_key == __this.friend) {
                                    __this.users.splice(i, 1);
                                    break ;
                                }
                            }
                            console.log(data);
                        });
                    }
                }
            }
        });

        /* ========================= */
        /*          MODAL            */
        /* ========================= */

        // comments component

        Vue.component('comment', {
            props: ['item'],
            template: '<li class="cl-item">' +
                        '<div class="comment-head">' +
                            '<div class="comment-owner-wrap">'+
                                '<img v-if="item.comentatorAvatar != 0" v-bind:src="item.comentatorAvatar" alt="comentator">'+
                                '<img v-else src="images/unknown.jpg" alt="comentator">'+
                            '</div>'+
                            '<div class="comment-owner-name">' +
                                '{{item.comentatorFullName}}'+
                                '<div class="comment-text">' +
                                    '{{item.comment}}'+
                                '</div>'+
                            '</div>'+
                        '</div>'+
                    '</li>'
        });

        _global.vue.modalPhoto = new Vue({
            el  : '.modal-photo-wrap',
            data: {
                photoSrc: _global.vue.modal.photoSrc
            }
        });

        _global.vue.modalPhotoData = new Vue({
            el  : '.modal-comments-head',
            data: {
                avatarSrc   : 'images/unknown.jpg',
                fullName    : 'empty',
                likes       : 0
            },
            methods: {
                like: function () {
                    var __this = this;

                    var ajax = new Ajax();
                    var ajaxReq = {
                        type    : 'POST',
                        body    : {
                            action  : 'like',
                            like    : {
                                img     : _global.vue.modal.photoSrc.split('/')[3],
                                imgOwner: _global.vue.modal.photoOwner
                            }
                        }
                    }
                    ajax.sendRequest('http://localhost:3000/profile', ajaxReq, function (data) {
                        console.log(data);
                        _global.socket.emit('like', {
                            to      :_global.vue.modal.photoOwner,
                            from    :_global.user.key,
                            action  :data.like
                        });
                        data.like == 'Unliked you.' ? __this.likes-- : __this.likes++;
                    })

                }
            }
        });

        _global.vue.modalPhotoComments = new Vue({
            el  : '.modal-comments-body',
            data: {
                comments: []
            }
        });

        _global.vue.modalSendNewComment = new Vue ({
            el: '.modal-comments-footer',
            data: {

            },
            methods: {
                sendComment: function () {
                    var text = document.querySelectorAll('.modal-comments-footer .textarea-wrap')[0].innerText.trim();

                    if (text) {
                        text = _global.functions.normalize(text);
                        var ajax = new Ajax;
                        var ajaxReq = {
                            type: 'POST',
                            body: {
                                action  : 'setNewComment',
                                comment : {
                                    text                : text,
                                    to                  : _global.user.key ? _global.user.key : _global.user.key,
                                    photo               : _global.vue.modal.photoSrc.split('/')[3],
                                    comentatorFullName  : _global.user.fullName
                                }
                            }
                        };
                        ajax.sendRequest('http://localhost:3000/profile', ajaxReq , function (data) {
                            // data == true ? _global.loadedObjects.profile = false : 0;
                            document.querySelectorAll('.modal-comments-footer .textarea-wrap')[0].innerText = '';
                            if (data != false) {
                                _global.vue.modalPhotoComments.comments.push({
                                    comment             : data.comment,
                                    comentatorKey       : data.comentator_key,
                                    comentatorFullName  : data.comentator_full_name,
                                    commentDate         : data.comment_date,
                                    comentatorAvatar    : _global.user.avatar
                                });
                                console.log(_global.vue.modalPhotoComments.comments);
                            }
                            console.log('data', data);
                        });
                    }

                }
            }
        });

        /* ========================= */
        /*         MESSAGES          */
        /* ========================= */

        Vue.component('chat', {
            props   : ['item'],
            template:   '<li class="pcl-item" v-bind:user="item.user_key" v-bind:chat="item.chat">'+
                            '<div class="interlocutor-img-wrap">' +
                                '<img v-if="item.photo_activated != 0" v-bind:src="item.photo_activated" alt="interlocutorAvatar"/>' +
                                '<img v-else src="images/unknown.jpg" alt="interlocutorAvatar"/>' +
                            '</div>'+
                            '<div class="time-of-last-message">{{item.message_date}}</div>'+
                            '<div class="interlocutor-name">{{item.name}} {{item.surname}}</div>'+
                            '<input v-bind:value="item.message" disabled="" class="last-message-of-chat"/>'+
                        '</li>'
        });

        Vue.component('message', {
            props   : ['item'],
            template:   '<li class="cmw-item" v-bind:class="item.user_key">'+
                            '<div>{{item.message}}</div>'+
                        '</li>'
        });

        _global.vue.chatsList = new Vue ({
            el  : '.profile-chat-wrap',
            data: {
                chats   : [],
                messages: [],
                interlocutor: {
                    name    : '',
                    key     : '',
                    avatar  : 'images/unknown.jpg'
                }
            },
            methods: {
                sendMsg: function () {
                    var __this = this;
                    var textarea = document.querySelectorAll('.chat-footer .textarea-wrap')[0];
                    var text = textarea.value.trim();
                    if (text) {
                        var ajax = new Ajax;
                        var ajaxReq = {
                            type: 'POST',
                            body: {
                                action  : 'sendMsg',
                                msg     : {
                                    text                : text,
                                    chat                : _global.chat.key
                                }
                            }
                        };
                        ajax.sendRequest('/profile', ajaxReq , function (data) {
                            textarea.value = '';
                            var date = new Date();
                            var msg = {
                                message: text,
                                message_date: (date.getMonth() + 1) +'/'+date.getDate()+'/'+date.getFullYear()+' '+date.getHours()+':'+date.getMinutes(),
                                msgOwner: _global.user.key,
                                user_key: "left-message"
                            };
                            __this.messages.push(msg);
                            _global.functions.scrollToBottom();
                            _global.socket.emit('msg', {
                                to      :_global.chat.interlocutor,
                                from    :_global.user.key,
                                action  :'New message.',
                                msg     : msg
                            });
                        });
                    }
                }
            }

        });

        /* ========================= */
        /*       FRIENDS PAGE        */
        /* ========================= */

        Vue.component('friends-list-item', {
            props   : ['item'],
            template:   '<li class="fl-item">'+
                            '<div class="friend-wrap" data-target="#profileMainContentCarousel" data-slide-to="7" v-bind:user="item.user_key">'+
                                '<div class="friend-img-wrap clearfix">' +
                                    '<img v-if="item.photo_activated != \'0\'" v-bind:src="item.photo_activated" alt="friendsImg"/>' +
                                    '<img v-else src="images/unknown.jpg" alt="friendsImg"/>' +
                                '</div>'+
                                '<div class="friends-full-name">{{item.name}} {{item.surname}}</div>'+
                            '</div>'+
                            '<div class="friend-dropdown dropdown">'+
                                '<button id="dropdownMenuButton" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" class="btn btn-secondary dropdown-toggle">' +
                                    '<i aria-hidden="true" class="fa fa-ellipsis-h"></i>' +
                                '</button>'+
                                '<div aria-labelledby="dropdownMenuButton" class="dropdown-menu">' +
                                    '<a href="#" action="sendMessage" class="dropdown-item">Send message</a>' +
                                    '<a href="#" action="deleteFriend" class="dropdown-item">Delete friend</a>' +
                                    '<a href="#" action="addToBlackList" class="dropdown-item">Add to blacklist</a>' +
                                    // '<a href="#" action="complainUser" class="dropdown-item">Complain user</a>' +
                                    // '<a href="#" action="fakeAccoount" class="dropdown-item">Fake account</a>' +
                                '</div>'+
                            '</div>'+
                        '</li>'
        });

        _global.vue.friendsList = new Vue ({
            el  : document.getElementsByClassName('friends-list-wrap')[0],
            data: {
                friends : []
            },
            methods: {
                addNewFriends: function (friendsList) {
                    if (!friendsList) return;
                    for (var i = 0; i < friendsList.length; i++) {
                        console.log(friendsList[i].photo_activated);
                        this.friends.push(friendsList[i]);
                    }
                },
                deleteAll: function () {
                    this.friends = [];
                },
                getAction: function () {
                    if (event.target.tagName == 'A') {
                        this.action = event.target.getAttribute('action');
                        this.friend =  event.target.parentElement.parentElement.previousSibling.getAttribute('user');
                        var __this  = this;
                        console.log(this.action, this.friend);

                        var ajax = new Ajax;
                        var ajaxReq = {
                            type: 'POST',
                            body: {
                                action  : this.action,
                                user    : this.friend
                            }
                        }
                        ajax.sendRequest('http://localhost:3000/profile', ajaxReq, function (data) {
                            for (var i = 0; i < __this.friends.length; i++) {
                                if (__this.friends[i].user_key == __this.friend) {
                                    __this.friends.splice(i, 1);
                                    break ;
                                }
                            }
                            console.log(data);
                        });
                    }
                }
            }

        });

        /* ========================= */
        /*     ANOTHER USER PAGE     */
        /* ========================= */

        Vue.component('au-profile-static-info', {
            props: ['item'],
            template: '<div><span v-bind:class="item.describeItemClass">{{item.describeItemText}}</span><span v-bind:class="item.valueItemClass">{{item.valueItemText}}</span></div>'
        });

        Vue.component('au-gallery-user-photo', {
            props: ['item'],
            template: '<li class="au-gpl-item" data-toggle="modal" data-target="#galleryPhotosModal"><div class="au-gpl-img-wrap"><img v-bind:src="item" alt="user photo"></div></li>'
        });

        Vue.component('au-hl-item', {
            props: ['item'],
            template:   '<li class="hl-item">' +
                        '{{item}}'+
                        '</li>'
        });

        _global.vue.auProfileName = new Vue ({
            el  : '.au-profile-name',
            data: {
                name    : 'emptyName',
                surname : 'emptySurname',
                status  : 'offline'
            },
            methods: {
                setAuProfileName: function (data) {
                    this.name   = data.name;
                    this.surname= data.surname;
                    this.status = data.online == 0 ? 'offline' : 'online';
                },
                deleteAll: function () {
                    this.name   = '';
                    this.surname= '';
                    this.status = 'offline';
                }
            }
        });

        _global.vue.auAvatarImg = new Vue ({
            el  : '.au-avatar',
            data: {
                photoSrc: 'images/unknown.jpg'
            },
            methods: {
                setAuAvatarImg: function (data) {
                    this.photoSrc = data.photo_activated == '0' ? 'images/unknown.jpg' : 'images/userPhotos/'+data.user_key+'/'+data.photo_activated;
                },
                getPhotoData: function () {
                    _global.vue.auGalleryPhotos.getPhotoData();
                },
                deleteAll: function () {
                    this.photoSrc = 'images/unknown.jpg'
                }
            }
        });

        _global.vue.auGalleryPhotos = new Vue ({
            el  : '.au-gallery-photos-wrap',
            data: {
                photos: []
            },
            methods: {
                getPhotoData: function () {
                    if (event.target.tagName == 'LI') {
                        _global.vue.modal.photoSrc = event.target.childNodes[0].childNodes[0].getAttribute('src');
                    } else if ( event.target.classList.contains('au-gpl-img-wrap')
                                || event.target.classList.contains('gpl-img-wrap')
                                || event.target.classList.contains('profile-avatar-wrap')) {
                        _global.vue.modal.photoSrc = event.target.childNodes[0].getAttribute('src');
                    } else {
                        _global.vue.modal.photoSrc = event.target.getAttribute('src');
                    }
                    _global.vue.modal.photoOwner = _global.vue.modal.photoSrc.split('/')[2];

                    var ajax = new Ajax;
                    var ajaxReq = {
                        type: 'POST',
                        body: {
                            action  : 'getPhotoData',
                            photo   : {
                                name : _global.vue.modal.photoSrc.split('/')[3],
                                owner: _global.vue.modal.photoOwner
                            }
                        }
                    };
                    ajax.sendRequest('http://localhost:3000/profile', ajaxReq, function (data) {
                        if (data.comments && data.comments[0].comment) {
                            console.log('!', data.comments);
                            _global.vue.modalPhotoComments.comments = data.comments;
                        } else {
                            _global.vue.modalPhotoComments.comments = [];
                        }
                        console.log('modal photo')
                        console.log(data);
                        if (data.photo.avatar != 0)
                            _global.vue.modalPhotoData.avatarSrc= 'images/userPhotos/'+_global.vue.modal.photoOwner+'/' + data.photo.avatar;
                        _global.vue.modalPhotoData.fullName     = data.photo.owner;
                        _global.vue.modalPhotoData.likes        = data.photo.likes;
                        console.log('modalPhotoData', _global.vue.modalPhotoData);
                    });
                    _global.vue.modalPhoto.photoSrc = _global.vue.modal.photoSrc;
                },
                setGalleryPhotos: function (data) {
                    console.log(data);
                    this.photos = data.photos;
                },
                deleteAll: function () {
                    this.photos = []
                }
            }
        });

        _global.vue.auUserHobbies = new Vue({
            el: '.au-hobbies-list',
            data: {
                hobbies: ['#no_hashtags_yet']
            },
            methods : {
                setAuUserHobbies: function (data) {
                    this.hobbies = data.hobbies.length == 0 ? ['#no_hashtags_yet'] : data.hobbies;
                },
                deleteAll: function () {
                    this.hobbies = [];
                }
            }
        });

        _global.vue.auProfileStatic = new Vue({
            el: '.au-profile-data-list',
            data: {
                profileStaticInfo: []
            },
            methods: {
                setUserInfo: function (data) {
                    this.profileStaticInfo = [];
                    for (var i = 0; i < data.length; i++) {
                        this.profileStaticInfo.push(data[i]);
                    }
                },
                deleteAll: function () {
                    this.profileStaticInfo = [];
                }
            }
        });

        _global.vue.auAboutYourself = new Vue({
            el: document.querySelectorAll('textarea[name="au-about-yourself"]')[0],
            data: {
                aboutUser: 'Describe yourself and your hobbies'
            },
            methods: {
                setAboutYourself: function (data) {
                    this.aboutYourself = data.about_yourself == null ? 'Describe yourself and your hobbies' : data.about_yourself
                }
            }
        });

        _global.vue.auBtns = new Vue({
            el: '.au-connection',
            data: {
                liked   : _global.anotherUserPage.liked,
                friends : _global.anotherUserPage.friends
            },
            methods: {
                addUserToFriends: function () {
                    if (!_global.anotherUserPage.friends) {
                        console.log(_global.anotherUserPage);
                        var ajax = new Ajax;
                        var ajaxReq = {
                            type: 'POST',
                            body: {
                                action  : 'addUserToFriends',
                                user    : _global.anotherUserPage.userKey
                            }
                        }
                        ajax.sendRequest('http://localhost:3000/profile', ajaxReq, function (data) {
                            console.log(data);
                        });
                    }
                },
                goToChat: function () {
                    if (_global.anotherUserPage.liked) {

                        console.log('will open chat when it will be ready');
                        // check if chat already exists if exists open chat else
                        // create new chat 2x and push it into the list of chats
                        // and open it.
                        var ajax = new Ajax;
                        var ajaxReq = {
                            type: 'POST',
                            body: {
                                action  : 'checkChat',
                                user    : _global.anotherUserPage.userKey
                            }
                        }
                        ajax.sendRequest('/profile', ajaxReq, function (data) {
                            console.log(data);
                        });
                    }
                }
            }
        });

        /* ========================= */
        /*          OPTIONS          */
        /* ========================= */

        Vue.component('new-uploaded-photo', {
            props: ['item'],
            template: '<div class="new-uploaded-img-wrap">'+
                        '<img v-bind:src="item" alt="new photo" v-bind:number="item.photoCounter">'+
                       '</div>'
        });

        _global.vue.addHashtag = new Vue ({
            el: document.querySelectorAll('.new-hashtag')[0],
            data: {
            },
            methods: {
                sendNewHashtag: function () {
                    var hash = document.querySelectorAll('input[name="input-hashtag"]')[0].value.trim();
                    if (!hash) return;
                    hash = _global.functions.normalize(hash);
                    hash.indexOf('#') != 0 ? hash = '#' + hash: 0;
                    hash = hash.replace(/ /g, '_');

                    var ajax = new Ajax;
                    var ajaxReq = {
                        type: 'POST',
                        body: {
                            action: 'setUserHobbie',
                            hash: hash
                        }
                    };
                    ajax.sendRequest('http://localhost:3000/profile', ajaxReq , function (data) {
                        data == true ? _global.loadedObjects.profile = false : 0;
                        console.log('data', data);
                    });
                }
            }
        });

        // photo uploading

        _global.vue.addUserAvatar = new Vue ({
            el : '.add-avatar',
            data : {
                photoSrc: '',
                photoName: ''
            },
            methods: {
                addNewImg: function () {
                    var uploadAvatar    = document.querySelector('input[name=upload-user-avatar]');
                    this.errMsg          = document.getElementsByClassName('upload-new-avatar-err')[0];
                    this.submitBtn      = document.getElementsByClassName('add-avatar-btn')[0];
                    this.imgWrap         = document.getElementsByClassName('upload-avatar-img-wrap')[0];
                    var file            = uploadAvatar.files[0]; //sames as here
                    var reader          = new FileReader();
                    var __this          = this;

                    if (!file.type.match(/.(jpg|jpeg|png|gif|bmp)$/i)) {
                        __this.errMsg.innerText = "It`s not an image!!\nI`m watching you -_-";
                        __this.errMsg.setAttribute('style', 'font-size: 1em;');
                    }
                    else if (file) {
                        reader.onloadend = function () {
                            __this.errMsg.removeAttribute('style');
                            __this.imgWrap.setAttribute('style', 'width: 100%;');
                            __this.photoSrc = reader.result;
                            __this.photoName = file.name;

                            __this.submitBtn.setAttribute('style', 'display:flex;');
                        }
                        reader.readAsDataURL(file); //reads the data as a URL
                    } else {
                        __this.errMsg.innerText = "Some error, try another file";
                        __this.errMsg.setAttribute('style', 'font-size: 1em;');
                    }
                },
                deletePhoto: function () {
                    var __this = this;
                    var elem;

                    console.log(event.target);
                    elem = event.target.tagName == 'IMG' ? event.target.parentElement : event.target;
                    elem.setAttribute('style', 'width: 0;');
                    setTimeout(function () {
                        elem.removeAttribute('style');
                    }, 300);
                    setTimeout(function () {
                        __this.photoSrc = '';
                        __this.photoName = '';
                        __this.errMsg.removeAttribute('style');
                        __this.submitBtn.removeAttribute('style');
                    }, 100)
                },
                savePhotos: function () {
                    var ajax = new Ajax;
                    var __this = this;
                    var ajaxReq = {
                        type: 'POST',
                        body: {
                            action: 'uploadUserAvatar',
                            photo: {
                                src: this.photoSrc,
                                name: this.photoName
                            }
                        }
                    };
                    console.log(ajaxReq);
                    ajax.sendRequest('http://localhost:3000/profile', ajaxReq , function (data) {
                        data.status == true ? _global.loadedObjects.profile = false : 0;
                        if (data.status == true) {
                            _global.vue.optionsRenderPhotos.photos.unshift('images/userPhotos/'+_global.user.key+'/'+ajaxReq.body.photo.name);
                            _global.vue.profileMenu.avatar  = 'images/userPhotos/'+_global.user.key+'/'+ajaxReq.body.photo.name;
                            _global.vue.mobileProfileMenu.avatar  = 'images/userPhotos/'+_global.user.key+'/'+ajaxReq.body.photo.name;
                            __this.photoSrc = '';
                            __this.photoName = '';
                            __this.errMsg.removeAttribute('style');
                            __this.imgWrap.removeAttribute('style');
                            __this.submitBtn.removeAttribute('style');
                        } else {
                            __this.errMsg.innerText = data.status;
                            __this.errMsg.setAttribute('style', 'font-size: 1em;');
                        }

                        console.log('data', data);
                    });
                }
            }
        });

        _global.vue.addUserPhoto = new Vue ({
            el : '.add-photos',
            data : {
                photoSrcArr : [],
                photoData: [],
                photoCounter : 0
            },
            methods: {
                addNewImg: function () {
                    var uploadPhoto     = document.querySelector('input[name=upload-user-photos]');
                    this.errMsg         = document.getElementsByClassName('upload-new-photo-err')[0];
                    this.submitBtn      = document.getElementsByClassName('add-photos-btn')[0];
                    var file            = uploadPhoto.files[0]; //sames as here
                    var reader          = new FileReader();
                    var __this          = this;

                    if (this.photoCounter > 3) {
                        this.errMsg.innerText = "You can`t download more than 4 pictures.";
                        this.errMsg.setAttribute('style', 'font-size: 1em;');
                    }
                    else if (!file.type.match(/.(jpg|jpeg|png|gif|bmp)$/i)) {
                        this.errMsg.innerText = "It`s not an image!!\nI`m watching you -_-";
                        this.errMsg.setAttribute('style', 'font-size: 1em;');
                    }
                    else if (file) {
                        reader.onloadend = function () {
                            __this.errMsg.removeAttribute('style');
                            __this.photoSrcArr.push(reader.result);
                            __this.photoData[__this.photoCounter] = {};
                            __this.photoData[__this.photoCounter].src = reader.result;
                            __this.photoData[__this.photoCounter].fileName = file.name;

                            __this.photoCounter++;
                            __this.submitBtn.setAttribute('style', 'display:flex;');
                        }
                        reader.readAsDataURL(file); //reads the data as a URL
                    } else {
                        this.rrMsg.innerText = "Some error, try another file";
                        this.errMsg.setAttribute('style', 'font-size: 1em;');
                    }
                },
                deletePhoto: function () {
                    var __this = this;
                    var elem = event.target.tagName != 'IMG' ? event.target.childNodes[0] : event.target;

                    for (var i = 0; i < this.photoSrcArr.length; i++)
                        if (elem.src == this.photoSrcArr[i]) break;
                    elem = event.target.tagName == 'IMG' ? event.target.parentElement : event.target;
                    elem.setAttribute('style', 'width: 0;');
                    setTimeout(function () {
                        elem.removeAttribute('style');
                    }, 300);
                    setTimeout(function () {
                        __this.photoSrcArr.splice(i, 1);
                        __this.photoData.splice(i, 1);
                        __this.photoCounter--;
                        if (__this.photoSrcArr.length == 0) {
                            __this.submitBtn.removeAttribute('style');
                            __this.errMsg.removeAttribute('style');
                        }
                    }, 100)
                },
                savePhotos: function () {
                    if (this.photoData.lengt == 0) return ;
                    var ajax = new Ajax;
                    var __this = this;
                    var ajaxReq = {
                        type: 'POST',
                        body: {
                            action: 'uploadUserPhotos',
                            photos: this.photoData
                        }
                    };
                    ajax.sendRequest('http://localhost:3000/profile', ajaxReq , function (data) {
                        if (data.status == true) {
                            console.log(__this.photoData);
                            for (var i = 0; i < __this.photoData.length; i++) {
                                _global.vue.optionsRenderPhotos.photos.unshift('images/userPhotos/'+_global.user.key+'/'+__this.photoData[i].fileName);
                            }
                            _global.loadedObjects.profile = false;
                            __this.errMsg.removeAttribute('style');
                            __this.deleteAll();
                        } else {
                            __this.errMsg.innerText = data.status;
                            __this.errMsg.setAttribute('style', 'font-size: 1em;');
                        }
                        console.log('data', data);
                    });
                },
                deleteAll: function () {
                    this.photoSrcArr  = [];
                    this.photoData    = [];
                    this.photoCounter = 0;
                    this.submitBtn.removeAttribute('style');
                }
            }
        });

        // photo deleting

        Vue.component('options-photo', {
            props: ['item'],
            template:   '<li class="options-photo">'+
                            '<div class="options-img-wrap">'+
                                '<img v-bind:src="item" alt="new photo">'+
                            '</div>'+
                        '</li>'
        });

        _global.vue.optionsRenderPhotos = new Vue ({
            el : '.delete-photos',
            data: {
                photos: [],
                photosToDelete: []
            },
            methods: {
                renderUserPhotos: function () {
                    var ajax    = new Ajax;
                    var __this  = this;
                    var ajaxReq = {
                        type: 'POST',
                        body: {
                            action: 'getProfileData'
                        }
                    };
                    ajax.sendRequest('http://localhost:3000/profile', ajaxReq , function (data) {
                        if (data.photo_activated != 0)
                            data.photos.push('images/userPhotos/'+data.user_key+'/'+data.photo_activated)
                        __this.photos = data.photos;
                        console.log('data', data);
                    });
                },
                markPhoto: function () {
                    var elem = event.target.tagName != 'IMG' ? event.target.childNodes[0] : event.target;
                    var photosToDelete = [];

                    if (elem.tagName == 'IMG' && !elem.style.opacity) {
                        elem.setAttribute('style', 'opacity: 0.3;');
                        this.photosToDelete.push(elem.getAttribute('src').split('/')[3]);
                    } else if (elem.style.opacity) {
                        elem.removeAttribute('style');
                        var name = elem.getAttribute('src').split('/')[3];
                        for (var i = 0; i < this.photosToDelete.length; i++) {
                            if (this.photosToDelete[i] == name) {
                                this.photosToDelete.splice(i, 1);
                                break ;
                            }
                        }
                    }
                },
                deletePhotos: function () {
                    if (this.photosToDelete.length == 0) return ;
                    console.log('this function will delete user photos from archive and database');
                    var ajax    = new Ajax;
                    var __this  = this;
                    var ajaxReq = {
                        type: 'POST',
                        body: {
                            action: 'deleteUserPhotos',
                            photos: this.photosToDelete
                        }
                    };
                    ajax.sendRequest('http://localhost:3000/profile', ajaxReq , function (data) {
                        for (var j = 0; j < __this.photosToDelete.length; j++)
                            document.querySelectorAll('img[src="'+'images/userPhotos/'+_global.user.key+'/'+__this.photosToDelete[j]+'"]')[0].removeAttribute('style');
                        first : for (var i = 0; i < __this.photos.length; i++)
                            for (var j = 0; j < __this.photosToDelete.length; j++)
                                if (__this.photosToDelete[j] == __this.photos[i].split('/')[3]) {
                                    if (__this.photosToDelete[j] == _global.user.avatar.split('/')[3]) {
                                        _global.user.avatar = 'images/unknown.jpg';
                                        _global.vue.profileMenu.avatar = 'images/unknown.jpg';
                                        _global.vue.mobileProfileMenu.avatar = 'images/unknown.jpg';
                                    }
                                    __this.photos.splice(i, 1);
                                    __this.photosToDelete.splice(j, 1);
                                    i = -1;
                                    break ;
                                    if (__this.photos.length == 0) break first;
                                }
                        _global.loadedObjects.profile = false;
                    });
                }
            }
        });

        /* ========================= */
        /*           SEARCH          */
        /* ========================= */

        Vue.component('founded-users', {
            props: ['item'],
            template:   '<li class="ful-item clearfix" v-bind:user="item.user_key" data-target="#profileMainContentCarousel" data-slide-to="7">'+
                            '<div class="founded-user-img-wrap">' +
                                '<img v-bind:src="item.photo_activated" alt="foundedUser"/>' +
                            '</div>'+
                            '<div class="founded-user-name">{{item.name}} {{item.surname}}</div>'+
                        '</li>'
        });

        _global.vue.foundedUsers = new Vue ({
            el  : '.founded-users-list-wrap',
            data: {
                users: []
            }
        });

        _global.vue.filters = new Vue ({
            el  : document.querySelectorAll('.search-input-wrap')[0],
            data: {
                maxFamous       : 10000,
                minFamous       : 0,
                maxAge          : 100,
                minAge          : 18,
                radius          : 500,
                sflCountry      : 'country',
                sflCity         : 'city',
                sex             : 'any',
                sexOrientation  : {
                    getero  : 1,
                    bisexual: 0,
                    lesbian : 0,
                    gay     : 0
                },
                name            : document.querySelectorAll('input[name="user-search-input"]')[0].value,
                findOnHashtags  : ''
            },
            methods: {
                findProfile: function () {
                    console.log(this);
                    console.log(this._data);
                    this.name = document.querySelectorAll('input[name="user-search-input"]')[0].value

                    var ajax    = new Ajax;
                    var __this  = this;
                    var ajaxReq = {
                        type: 'POST',
                        body: {
                            action: 'findUsers',
                            options: this._data
                        }
                    };
                    ajax.sendRequest('http://localhost:3000/profile', ajaxReq , function (data) {
                        console.log(data);
                        for (var i = 0; i < data.length; i++) {
                            console.log(i);
                            if (data[i].photo_activated != 0)
                                data[i].photo_activated = 'images/userPhotos/'+data[i].user_key+'/'+data[i].photo_activated;
                            else
                                data[i].photo_activated = 'images/unknown.jpg';
                        }
                        _global.vue.foundedUsers.users = data;
                        console.log(data);
                    });
                },
                setAction: function (value) {
                    this[value.action] = document.querySelectorAll('input[name='+value.action+']')[0].value;
                },
                toggleSexOrientation: function (value) {
                    this.sexOrientation[value] = this.sexOrientation[value] == 1 ? 0 : 1;
                },
                toggleSex: function (value) {
                    this.sex = value;
                }

            }
        });


        /* ========================= */
        /*      CHANGE USER DATA     */
        /* ========================= */

        for (var i = 0, ageCounter = 18, age = []; i < 82; i++, ageCounter++) {age[i] = ageCounter;}

        _global.vue.changeUserData = new Vue ({
            el  : document.querySelectorAll('div[data-page="changeUserData"]')[0],
            data: {
                user: {
                    name    : '',
                    surname : '',
                    country : '',
                    city    : '',
                    email   : ''
                },
                ageList: age
            },
            methods: {
                getAge: function () {
                    this.user.age = event.target.getAttribute('data');
                },
                getData: function () {
                    var form = {};
                    form.name       = _global.functions.normalize(document.querySelectorAll('input[name="changeUserName"]')[0].value.trim());
                    form.surname    = _global.functions.normalize(document.querySelectorAll('input[name="changeUserSurname"]')[0].value.trim());
                    form.country    = _global.functions.normalize(document.querySelectorAll('input[name="changeUserCountry"]')[0].value.trim());
                    form.city       = _global.functions.normalize(document.querySelectorAll('input[name="changeUserCity"]')[0].value.trim());
                    if (document.querySelectorAll('input[name="changeUserEmail"]')[0].checkValidity() == true)
                        form.email  = _global.functions.normalize(document.querySelectorAll('input[name="changeUserEmail"]')[0].value.trim());
                    else
                        form.email  = '';
                    form.age        = this.user.age;

                    if (checkRadio() && checkFields()) {
                        if (form.country || form.city) {
                            getGeopositionFromForm(form, function () {
                                sendUserData(form);
                            });
                        } else
                            sendUserData(form);

                        console.log('form passed validation and there is some values : ', form);
                    }

                    function checkFields() {
                        console.log(form);
                        for (var field in form) {
                            form[field] == _global.user[field] ? console.log('deleted', form[field], _global.user[field]) : 0;
                            !form[field] || form[field] == _global.user[field] ? delete form[field] : 0;
                        }
                        return (Object.keys(form).length === 0 ? false : true);
                        console.log(form);
                    }

                    function checkRadio () {
                        var checked = 0;
                        var radio   = {
                            all             : document.querySelectorAll('.reg-checkbox-wrap input'),
                            sex             : null,
                            sexOrientation  : null
                        }

                        for (var i = 0; i < 4; i++) {radio.all[i].checked == true ? radio.sexOrientation = radio.all[i] : 0;}
                        for (var i = 4; i < radio.all.length; i++) {radio.all[i].checked == true ? radio.sex = radio.all[i] : 0;}

                        form.sex            = radio.sex.value;
                        form.sex_orientation= radio.sexOrientation.value;

                        (radio.sexOrientation && radio.sex) ? 0 : checked = 1;

                        return (checked == 1 ? false : true);
                    }

                    function getGeopositionFromForm(form, callback) {
                        var geocoder;
                        var __this = this;
                        initialize();
                        !form.country ? form.country = _global.user.country : 0;
                        !form.city ? form.city = _global.user.city : 0;
                        codeAddress(form.country + ", " + form.city);

                        function initialize() {
                            geocoder = new google.maps.Geocoder();
                        }

                        function codeAddress(address) {
                            geocoder.geocode( { 'address': address}, function(results, status) {
                                if (status == 'OK') {
                                    form.latitude           = results[0].geometry.location.lat();
                                    form.longitude          = results[0].geometry.location.lng();
                                    callback();
                                } else {
                                    console.log('ERR, Geocode was not successful for the following reason: ' + status)
                                }
                            });
                        }
                    }

                    function sendUserData() {
                        var ajax    = new Ajax;
                        var __this  = this;
                        var ajaxReq = {
                            type: 'POST',
                            body: {
                                action: 'updateUserInfo',
                                data: form
                            }
                        };
                        ajax.sendRequest('http://localhost:3000/profile', ajaxReq , function (data) {
                            data.name || data.surname ?  _global.user.fullName = data.name + ' ' + data.surname : 0;
                            data.name           ?  _global.user.name           = data.name : 0;
                            data.surname        ?  _global.user.surname        = data.surname : 0;
                            data.country        ?  _global.user.country        = data.country : 0;
                            data.city           ?  _global.user.city           = data.city : 0;
                            data.email          ?  _global.user.email          = data.email : 0;
                            data.age            ?  _global.user.age            = data.age : 0;
                            data.sex            ?  _global.user.sex            = data.sex : 0;
                            data.sex_orientation?  _global.user.sexOrientation = data.sex_orientation : 0;
                            _global.loadedObjects.profile = false;
                            console.log(data);
                        });
                    }
                }

            }
        });

    }
}

class Emit {
    constructor () {
        var __this = this;

        _global.socket.on('like', function (data) {
            // ВКЛЮЧИТЬ ПРИ СДАЧЕ
            // _global.functions.playSound('audio/notif');
            _global.vue.notificationsList.notifications.push(data);
        });

        _global.socket.on('visit', function (data) {
            // ВКЛЮЧИТЬ ПРИ СДАЧЕ
            // _global.functions.playSound('audio/notif');
            _global.vue.notificationsList.notifications.push(data);
        });

        _global.socket.on('msg', function (data) {
            // ВКЛЮЧИТЬ ПРИ СДАЧЕ
            // _global.functions.playSound('audio/notif');
            _global.vue.notificationsList.notifications.push(data);
            _global.vue.chatsList.messages.push(data.messageInfo);
            _global.functions.scrollToBottom();
        });
    }
}

window.onload = function () {
	// var mainProfile = new MainProfile(loadedObjects);
    var eventClass  = new ProfilePage;
    var vueUpload   = new VueUpload;
    _global.socket  = io();
    var emits       = new Emit();
    var logout      = document.getElementsByClassName('header-logout')[0];


    $('#profileMainContentCarousel').on('slid.bs.carousel', function () {
        var targetPage = this.getElementsByClassName('active')[0].getAttribute('data-page');
        console.log('TERGET PAGE', targetPage);

        switch (targetPage) {
            case 'profile':
                eventClass = new ProfilePage;
                break ;
            case 'messages':
                eventClass = new MessagesPage;
                break ;
            case 'friends':
                eventClass = new FriendsPage;
                break ;
            case 'options':
                eventClass = new OptionsPage;
                break ;
            case 'search':
                eventClass = new SearchPage;
                break ;
            case 'blacklist':
                eventClass = new BlacklistPage;
                break ;
            case 'anotherUser':
                eventClass = new AnotherUserPage;
                break ;
            default:
                break ;
        }
    });

    logout.onclick = function () {
        var ajax = new Ajax;
        var ajaxReq = {
            type: 'POST',
            body: {
                action  : 'logout'
            }
        };
        ajax.sendRequest('http://localhost:3000/profile', ajaxReq, function (data) {
            data == true ? window.location.href = 'login' : alert('ERROR, please refresh page.');
        });
    }
}
