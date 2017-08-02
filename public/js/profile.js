var _global = {};

_global.anotherUserPage = {}
_global.anotherUserPage.userKey = 'empty';

_global.vue = {};
_global.vue.modal = {};

_global.functions = {
    normalize: function (str) {
        var div = document.createElement('div');
        var text = document.createTextNode(str);
        div.appendChild(text);
        return div.innerHTML;
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
		if (_global.loadedObjects.profile == false) {
            // запускаем longрull запрос для странички профиля
            //      если данные пришли перерендериваем не статические элементы
            this.renderProfilePage();
            //рендерим все данные на странице
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
		this.chat = document.getElementsByClassName('chat-wrap')[0];
		this.closeChatBtn = document.getElementsByClassName('close-chat-btn')[0];

		var __this = this;

		this.closeChatBtn.onclick = function () {
			__this.closeChat();
		}

		this.addHandler(document, 'click', function () {
			var className = event.target.className ? event.target.className : 'false';

			if ((document.querySelectorAll('.pcl-item .' + className).length != 0 || className === 'pcl-item')
				&& className != 'interlocutor-name') {
				__this.openChat();
			}
		});
	}

	closeChat() {
		this.chat.removeAttribute('style');
	}

	openChat () {
		this.chat.setAttribute('style', 'left:0;');
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
            if (event.target.hasAttribute('user')) {
                _global.anotherUserPage.userKey = event.target.getAttribute('user');
            } else if (event.target.classList.contains('friends-full-name')) {
                _global.anotherUserPage.userKey = event.target.parentElement.getAttribute('user');
            } else if (event.target.hasAttribute('alt')) {
                var el = event.target.getAttribute('alt').toString();
                el == "friendsImg" ? _global.anotherUserPage.userKey = event.target.parentElement.parentElement.getAttribute('user') : 0;
            }
            console.log(_global.anotherUserPage.userKey)
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

    }
}

class SearchPage extends MainProfile {
	constructor () {
		super();
		console.log('class SearchPage created!');
	}
}

class BlacklistPage extends MainProfile {
	constructor () {
		super();
		console.log('class BlacklistPage created!');
	}
}

class AnotherUserPage extends MainProfile {
	constructor () {
		super();

		this.renderAnotherUserPage();

		console.log('class AnotherUserPage created!');
	}

	getUserData (callback) {

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
            console.log('data', data);
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

        _global.vue.modalPhoto = new Vue({
            el  : '.modal-photo-wrap',
            data: {
                photoSrc: _global.vue.modal.photoSrc
            }
        });

        _global.vue.userPhotos = new Vue({
            el  : '.gallery-photos-wrap',
            data: {
                photos: null
            },
            methods: {
                getPhotoData: function () {
                    _global.vue.modal.photoSrc = event.target.getAttribute('src');
                    _global.vue.modal.photoOwner = _global.vue.modal.photoSrc.split('/')[2];

                    _global.vue.modalPhoto.photoSrc = _global.vue.modal.photoSrc;
                },
                setUserPhotos: function (data) {
                    this.photos = data.photos.length != 0 ? data.photos : null
                }
            }
        });

        /* ========================= */
        /*       FRIENDS PAGE        */
        /* ========================= */

        Vue.component('friends-list-item', {
            props   : ['item'],
            template:   '<li data-target="#profileMainContentCarousel" class="fl-item clearfix" data-slide-to="6" v-bind:user="item.user_key">'+
                            '<div class="friend-img-wrap">' +
                                '<img v-if="item.photo_activated != \'0\'" v-bind:src="item.photo_activated" alt="friendsImg"/>' +
                                '<img v-else src="images/unknown.jpg" alt="friendsImg"/>' +
                            '</div>'+
                            '<div class="friends-full-name">{{item.name}} {{item.surname}}</div>'+
                            '<div class="friend-dropdown dropdown">'+
                                '<button id="dropdownMenuButton" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" class="btn btn-secondary dropdown-toggle">' +
                                    '<i aria-hidden="true" class="fa fa-ellipsis-h"></i>' +
                                '</button>'+
                                '<div aria-labelledby="dropdownMenuButton" class="dropdown-menu">' +
                                    '<a href="#" class="dropdown-item">Send message</a>' +
                                    '<a href="#" class="dropdown-item">Delete friend</a>' +
                                    '<a href="#" class="dropdown-item">Add to blacklist</a>' +
                                    '<a href="#" class="dropdown-item">Complain user</a>' +
                                    '<a href="#" class="dropdown-item">Fake account</a>' +
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
                    for (var i = 0; i < friendsList.length; i++) {
                        console.log(friendsList[i].photo_activated);
                        this.friends.push(friendsList[i]);
                    }
                },
                deleteAll: function () {
                    this.friends = [];
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
            el  : '.au-avatar-img',
            data: {
                photoSrc: 'images/unknown.jpg'
            },
            methods: {
                setAuAvatarImg: function (data) {
                    this.photoSrc = data.photo_activated == '0' ? 'images/unknown.jpg' : 'images/userPhotos/'+data.user_key+'/'+data.photo_activated;
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
                    _global.vue.modal.photoSrc = event.target.getAttribute('src');
                    _global.vue.modal.photoOwner = _global.vue.modal.photoSrc.split('/')[2];

                    _global.vue.modalPhoto.photoSrc = _global.vue.modal.photoSrc;
                },
                setGalleryPhotos: function (data) {
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

        _global.vue.addUserAvatar = new Vue ({
            el : '.add-avatar',
            data : {
                photoSrc: '',
                photoName: ''
            },
            methods: {
                addNewImg: function () {
                    var uploadAvatar    = document.querySelector('input[name=upload-user-avatar]');
                    var errMsg          = document.getElementsByClassName('upload-new-avatar-err')[0];
                    this.submitBtn      = document.getElementsByClassName('add-avatar-btn')[0];
                    var imgWrap         = document.getElementsByClassName('upload-avatar-img-wrap')[0];
                    var file            = uploadAvatar.files[0]; //sames as here
                    var reader          = new FileReader();
                    var __this          = this;

                    if (!file.type.match(/.(jpg|jpeg|png|gif|bmp)$/i)) {
                        errMsg.innerText = "It`s not an image!!\nI`m watching you -_-";
                        errMsg.setAttribute('style', 'font-size: 1em;');
                    }
                    else if (file) {
                        reader.onloadend = function () {
                            errMsg.removeAttribute('style');
                            imgWrap.setAttribute('style', 'width: 100%;');
                            __this.photoSrc = reader.result;
                            __this.photoName = file.name;

                            __this.submitBtn.setAttribute('style', 'display:flex;');
                        }
                        reader.readAsDataURL(file); //reads the data as a URL
                    } else {
                        errMsg.innerText = "Some error, try another file";
                        errMsg.setAttribute('style', 'font-size: 1em;');
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
                        data == true ? _global.loadedObjects.profile = false : 0;
                        if (data.status == true) {
                            __this.photoSrc = '';
                            __this.photoName = '';
                            __this.submitBtn.removeAttribute('style');
                        } else {
                            errMsg.innerText = data.status;
                            errMsg.setAttribute('style', 'font-size: 1em;');
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
                    this.errMsg          = document.getElementsByClassName('upload-new-photo-err')[0];
                    this.submitBtn       = document.getElementsByClassName('add-photos-btn')[0];
                    var file    = uploadPhoto.files[0]; //sames as here
                    var reader  = new FileReader();
                    var __this = this;

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


    }
}

window.onload = function () {
	// var mainProfile = new MainProfile(loadedObjects);
    var eventClass = new ProfilePage;
    var vueUpload  = new VueUpload;


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
}
