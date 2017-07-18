class Chat {

}

class MainProfile {
	constructor () {
		this.textareaAutoresize = new TextareaAutoresize;

		var floatMenu = {};
		floatMenu.btnMenuOut = document.getElementsByClassName('menu_icon_out')[0];
		floatMenu.btnMenuIn = document.getElementsByClassName('menu_icon_in')[0];
		floatMenu.menu = document.getElementsByClassName('float_menu_wrap')[0];
		floatMenu.openMenu = this.openMenu;
		floatMenu.closeMenu = this.closeMenu;

		floatMenu.btnMenuOut.onclick = function () {
			floatMenu.openMenu();
		}
		floatMenu.btnMenuIn.onclick = function () {
			floatMenu.closeMenu();
		}
		document.onclick = function () {
			var className = event.target.className ? event.target.className : 'false';
			if (document.querySelectorAll('.float_menu_wrap .' + className).length === 0) {
		        floatMenu.closeMenu();
		    }
		}
	}

	openMenu () {
		this.btnMenuOut.style.display = 'none';
	    this.btnMenuIn.style.display = 'block';
        this.menu.style.transform = "translateX(0px)";
	};

	closeMenu () {
	    this.btnMenuOut.style.display = '';
	    this.btnMenuIn.style.display = '';
	    this.menu.style.transform = "translateX(-250px)";
	};
}

window.onload = function () {
	var mainProfile = new MainProfile;

	//add to chat class
	var block = document.getElementsByClassName("chat-body")[0];
	block.scrollTop = block.scrollHeight;
}
