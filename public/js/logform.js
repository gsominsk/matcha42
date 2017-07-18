class LogForm {
    constructor () {
        this.btnOpenReg = document.getElementsByClassName('register')[0];
        this.btnCloseReg = document.getElementsByClassName('if_back')[0];
        this.firstForm = document.getElementsByClassName('input_form_wrap')[0];
        this.secondForm = document.getElementsByClassName('input_form_wrap')[1];
        this.name = document.querySelectorAll("[name=\"name_reg\"")[0];
        this.email = document.querySelectorAll("[name=\"email\"")[0];
        this.password = document.querySelectorAll("[name=\"pass_new\"")[0];
        this.passwordRe = document.querySelectorAll("[name=\"pass_new_re\"")[0];

        var logform = {};
        logform = this;

        this.password.onchange = function () {
            logform.checkPasswords;
        }
        this.passwordRe.onchange = function () {
            logform.checkPasswords;
        }

        logform.btnOpenReg.onclick = function() {
            logform.openReg();
        }

        logform.btnCloseReg.onclick = function() {
            logform.closeReg();
        }
    }

    openReg () {
        var el = this;
        el.secondForm.style.display = 'block';
        el.firstForm.classList.add('hide_block');
        el.firstForm.classList.remove('show_block');
        setTimeout(function () { el.firstForm.style.display = 'none'; }, 400);
        setTimeout(function () { el.secondForm.classList.add('show_block'); }, 400);
    }

    closeReg () {
        var el = this;
        el.secondForm.classList.add('hide_block');
        el.secondForm.classList.remove('show_block');
        setTimeout(function () { el.firstForm.style.display = 'block'; }, 400);
        setTimeout(function () {
            el.firstForm.classList.add('show_block');
            el.secondForm.style.display = 'none';
        }, 600);
    }

    checkPasswords () {
        if (this.password.value != this.passwordRe.value) {
            this.passwordRe.setCustomValidity("Пароли не совпадают");
            this.passwordRe.style.borderBottom = this.password.style.borderBottom = '1px solid red';
            return (0);
        } else if ((password.value.length < 5 || this.password.value.length > 20) || (this.passwordRe.value.length < 5 || this.passwordRe.value.length > 20)){
            this.passwordRe.setCustomValidity("Пароль не соотвутствует длине. От 5 - 20 символов.");
            this.passwordRe.style.borderBottom = this.password.style.borderBottom = '1px solid red';
            return (0);
        } else {
            this.passwordRe.setCustomValidity('');
            this.passwordRe.style.borderBottom = this.password.style.borderBottom = '1px solid limegreen';
            return (1);
        }
    }
}

window.onload = function() {
    var logForm = new LogForm;

    // document.getElementsByClassName('if_submit_reg')[0].addEventListener('click', function () {
    //     if (checkPasswords() && checkEmail()) {
    //         ajaxReg('../../php/registration.php', function(data) {
    //             alert(JSON.stringify(data));
    //         });
    //     }
    //     return false;
    // });
    //
	// function ajaxReg(url, callback) {
    //     let email = document.querySelectorAll("[name=\"email\"")[0];
    //     let xhr = new XMLHttpRequest();
    //     let body =  'name_reg=' + encodeURIComponent(name.value) +
    //                 '&email=' + encodeURIComponent(email.value) +
    //                 '&pass_new=' + encodeURIComponent(password.value) +
    //                 '&pass_new_re=' + encodeURIComponent(passwordRe.value);
    //     xhr.open('POST', url, true);
    //     xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
	// 	xhr.onload = function (e) {
	// 		if (xhr.status != 200) {
	// 			console.log(xhr.status + ': ' + xhr.statusText);
	// 		} else {
	// 			let str = JSON.parse(xhr.responseText);
    //
	// 			if (str.user === "found") {
	// 				email.setCustomValidity("Данная почта уже существует.");
	// 			} else {
	// 				document.getElementsByClassName("email_created")[0].style.display = "block";
	// 				email.setCustomValidity("");
	// 				setTimeout(function () {
	// 					// window.location.href = "../../public/html/log_form.php";
	// 				}, 3000);
	// 			}
	// 			// console.log(xhr.responseText);
	// 		}
	// 	}
    //     xhr.send(body);
    // }
    //
    // /*
    // ** ===================================================
    // **              Форма входа через AJAX
    // ** ===================================================
    // */
    //
    // document.getElementsByClassName('if_submit_log')[0].addEventListener('click', function () {
    //
    //     ajaxLogIn('../../php/login.php', function(data) {
    //         alert(JSON.stringify(data));
    //     });
    //     return false;
    // });
    //
    // function ajaxLogIn(url, callback) {
    //     let email = document.querySelectorAll("[name=\"email_log\"")[0];
    //     let password = document.querySelectorAll("[name=\"pass_log\"")[0];
    //     let xhr = new XMLHttpRequest();
    //     let body =  'email=' + encodeURIComponent(email.value) +
    //                 '&password=' + encodeURIComponent(password.value);
    //     xhr.open('POST', url, true);
    //     xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
    //     xhr.onload = function (e) {
    //         if (xhr.status != 200) {
    //             console.log(xhr.status + ': ' + xhr.statusText);
    //         } else {
    //             // console.log(xhr.responseText);
    //             let str = JSON.parse(xhr.responseText);
    //
    //             if (str.user === "found") {
    //                 // console.log("found");
    //                 setTimeout(function () {
    //                     window.location.href = "../../public/html/index.php";
    //                 }, 500)
    //             } else {
    //                 document.getElementsByClassName("error_name_wrap")[0].style.display = "block";
    //             }
    //             // console.log(xhr.responseText);
    //         }
    //     }
    //     xhr.send(body);
    // }
}
