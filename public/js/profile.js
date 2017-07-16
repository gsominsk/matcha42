class Chat {

}

class MainProfile {
	constructor () {
		this.textareaAutoresize = new TextareaAutoresize;
	}
}

window.onload = function () {
	var mainProfile = new MainProfile;

	var block = document.getElementsByClassName("chat-body")[0];
	block.scrollTop = block.scrollHeight;
}
