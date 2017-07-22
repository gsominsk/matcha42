class Chat {
	constructor () {
		var block = document.getElementsByClassName("chat-body")[0];
		block.scrollTop = block.scrollHeight;
	}
}

class ProfilePage {
	constructor (global) {
		if (global.loadedObjects.profile == false) {
			var ajax = new Ajax;

			// ajax.sendRequest('')
			console.log(global);
		}
	}
}

class MessagesPage {
	constructor (global) {
		this.chat = document.getElementsByClassName('chat-wrap')[0];
		this.closeChatBtn = document.getElementsByClassName('close-chat-btn')[0];

		var __this = this;

		this.closeChatBtn.onclick = function () {
			__this.closeChat();
		}

		global.addHandler(document, 'click', function () {
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
class FriendsPage {
	constructor () {
		console.log('class FriendsPage created!');
	}
}
class OptionsPage {
	constructor () {
		console.log('class OptionsPage created!');
	}
}
class SearchPage {
	constructor () {
		console.log('class SearchPage created!');
	}
}
class BlacklistPage {
	constructor () {
		console.log('class BlacklistPage created!');
	}
}
class AnotherUserPage {
	constructor () {
		console.log('class AnotherUserPage created!');
	}
}

class MainProfile {
	constructor (loadedObjects) {
		this.loadedObjects = loadedObjects;
		this.textareaAutoresize = new TextareaAutoresize;
		this.floatMenu = new FloatMenu(this);

		var __this = this;
		// __this.animationLoadingStart();
		var eventClass = new ProfilePage(this);

		$('#profileMainContentCarousel').on('slid.bs.carousel', function () {
			var targetPage = this.getElementsByClassName('active')[0].getAttribute('data-page');

			switch (targetPage) {
				case 'profile':
					eventClass = new ProfilePage(__this);
					break ;
				case 'messages':
					eventClass = new MessagesPage(__this);
					break ;
				case 'friends':
					eventClass = new FriendsPage(__this);
					break ;
				case 'options':
					eventClass = new OptionsPage(__this);
					break ;
				case 'search':
					eventClass = new SearchPage(__this);
					break ;
				case 'blacklist':
					eventClass = new BlacklistPage(__this);
					break ;
				case 'anotherUser':
					eventClass = new AnotherUserPage(__this);
					break ;
				default:
					break ;
			}
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

window.onload = function () {
	var loadedObjects = {
		profile		:false,
		messages	:false,
		friends		:false,
		options		:false,
		search		:false,
		blacklist	:false,
		anotherUser	:false
	}
	var mainProfile = new MainProfile(loadedObjects);
}
