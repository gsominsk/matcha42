class FloatMenu {
	constructor (global) {
		this.btnMenuOut = document.getElementsByClassName('menu_icon_out')[0];
		this.btnMenuIn = document.getElementsByClassName('menu_icon_in')[0];
		this.menu = document.getElementsByClassName('float_menu_wrap')[0];
		this.openMenu = this.openMenu;
		this.closeMenu = this.closeMenu;

		var __this = this;

		__this.btnMenuOut.onclick = function () {
			__this.openMenu();
		}
		__this.btnMenuIn.onclick = function () {
			__this.closeMenu();
		}
		global.addHandler(document, 'click', function () {
			var className = event.target.className ? event.target.className : 'false';
			if (document.querySelectorAll('.float_menu_wrap .' + className).length === 0 || className === 'pml-item') {
				__this.closeMenu();
			}
		});
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
