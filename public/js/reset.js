class ResetForm {
    constructor() {
        this.sendKeyBtn             = document.getElementsByClassName('check_pass')[0];
        this.getKeyBtn              = document.getElementsByClassName('if_back_to_email')[0];
        this.sendNewPassBtn         = document.getElementsByClassName('change_pass_btn')[0];
        this.firstForm              = document.getElementsByClassName('input_form_wrap')[0];
        this.secondForm             = document.getElementsByClassName('input_form_wrap')[1];
        this.emailForKey            = document.querySelectorAll('input[name="email_reset"]')[0];
        this.resetPassFirstInfo     = document.getElementsByClassName('email_created')[0];
        this.resetPassSecondInfo    = document.getElementsByClassName('email_created')[1];
        this.logform                = {};
        this.logform.keyToRestore   = document.querySelectorAll('input[name="user_key"]')[0];
        this.logform.userPassword   = document.querySelectorAll('input[name="pass_reset"]')[0];
        this.logform.userPasswordRe = document.querySelectorAll('input[name="pass_reset_re"]')[0];
    }

    openReg() {
        var __this = this;
        __this.secondForm.style.display = 'block';
        __this.firstForm.classList.add('hide_block');
        __this.firstForm.classList.remove('show_block');
        setTimeout(function () {
            __this.firstForm.style.display = 'none';
        }, 400);
        setTimeout(function () {
            __this.secondForm.classList.add('show_block');
        }, 400);
    }

    closeReg() {
        var __this = this;
        __this.secondForm.classList.add('hide_block');
        __this.secondForm.classList.remove('show_block');
        setTimeout(function () {
            __this.firstForm.style.display = 'block';
        }, 400);
        setTimeout(function () {
            __this.firstForm.classList.add('show_block');
            __this.secondForm.style.display = 'none';
        }, 600);
    }

    normalize (str) {
        var div = document.createElement('div');
        var text = document.createTextNode(str);
        div.appendChild(text);
        return div.innerHTML;
    }
}

class SendKey extends ResetForm {
    constructor () {
        super();
    }

    getKey (callback) {
        var values      = {};
        values.email    = this.normalize(this.emailForKey.value.trim());
        values.mail     = true;

        if (values.email && this.emailForKey.checkValidity()) {
            var ajax = new Ajax;

            var ajaxReq = {
                type: 'POST',
                body: values
            };
            // !! dev !!
            console.log(ajaxReq.body);
            ajax.sendRequest('http://localhost:3000/reset', ajaxReq , function (data) {
                console.log(data ? data : 0);
                callback(data);
            });
        }
    }
}

class SendNewPass extends ResetForm {
    constructor () {
        super();

        var __this = this;

        this.sendNewPassBtn.onclick = function () {
            if (__this.checkPasswords() && __this.logform.keyToRestore.value.trim()) {
                var ajax = new Ajax;

                var ajaxReq = {
                    type: 'POST',
                    body: {
                        pass: __this.normalize(__this.logform.userPassword.value.trim()),
                        key : __this.normalize(__this.logform.keyToRestore.value.trim())
                    }
                };
                // !! dev !!
                console.log(ajaxReq.body);
                ajax.sendRequest('http://localhost:3000/reset', ajaxReq , function (data) {
                    console.log(data);
                    if (data == 'password changed') {
                        window.location.href = 'http://localhost:3000/login';
                    } else if (data == 'old password'){
                        __this.resetPassSecondInfo.innerHTML = "Вы не можете поменять пароль на старый!";
                        console.log('ERR, wrong key.');
                    } else {
                        __this.resetPassSecondInfo.innerHTML = "Не верно указанный ключ!";
                    }
                });
            }
        }
    }

    checkPasswords () {
        if (this.logform.userPassword.value != this.logform.userPasswordRe.value) {
            this.logform.userPasswordRe.setCustomValidity("Пароли не совпадают");
            this.logform.userPasswordRe.style.borderBottom = this.logform.userPassword.style.borderBottom = '1px solid red';
            return (0);
        } else if ((this.logform.userPassword.value.length < 5 || this.logform.userPassword.value.length > 20) || (this.logform.userPasswordRe.value.length < 5 || this.logform.userPasswordRe.value.length > 20)){
            this.logform.userPasswordRe.setCustomValidity("Пароль не соотвутствует длине. От 5 - 20 символов.");
            this.logform.userPasswordRe.style.borderBottom = this.logform.userPassword.style.borderBottom = '1px solid red';
            return (0);
        } else {
            this.logform.userPasswordRe.setCustomValidity('');
            this.logform.userPasswordRe.style.borderBottom = this.logform.userPassword.style.borderBottom = '1px solid limegreen';
            return (1);
        }
    }
}

window.onload = function () {
    var form    = new ResetForm;
    var formSendKey = new SendKey;


    form.sendKeyBtn.onclick = function() {
        formSendKey.getKey(function (email) {
            if (email == 'mail sended') {
                form.openReg();
                formResetPass = new SendNewPass;
            } else {
                formSendKey.resetPassFirstInfo.innerHTML = 'Указанная почта не зарегестрирована!'
            }
        });
    }

    form.getKeyBtn.onclick = function() {
        form.closeReg();
    }
}