class Form {
    constructor () {
        this.btnOpenReg     = document.getElementsByClassName('register')[0];
        this.btnCloseReg    = document.getElementsByClassName('if_back')[0];
        this.firstForm      = document.getElementsByClassName('input_form_wrap')[0];
        this.secondForm     = document.getElementsByClassName('input_form_wrap')[1];
        this.successMsg     = document.getElementsByClassName('email_created')[0];

        var __this = this;
    }

    openReg () {
        var __this = this;
        __this.secondForm.style.display = 'block';
        __this.firstForm.classList.add('hide_block');
        __this.firstForm.classList.remove('show_block');
        setTimeout(function () { __this.firstForm.style.display = 'none'; }, 400);
        setTimeout(function () { __this.secondForm.classList.add('show_block'); }, 400);
    }

    closeReg () {
        var __this = this;
        __this.secondForm.classList.add('hide_block');
        __this.secondForm.classList.remove('show_block');
        setTimeout(function () { __this.firstForm.style.display = 'block'; }, 400);
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

    addHandler(object, event, handler, useCapture) {
        if (object.addEventListener) {
            object.addEventListener(event, handler, useCapture ? useCapture : false);
        } else if (object.attachEvent) {
            object.attachEvent('on' + event, handler);
        } else alert("Add handler is not supported");
    }
}

class LogForm extends Form {
    constructor () {
        super();
        this.userEmail  = document.querySelectorAll('input[name="email_log"]')[0];
        this.userPass   = document.querySelectorAll('input[name="pass_log"]')[0];
        this.logInBtn   = document.getElementsByClassName('if_submit_log')[0];
        this.logErr     = document.getElementsByClassName('error_name_wrap')[0];

        var __this = this;

        this.logInBtn.onclick = function () {
            __this.values           = {};
            __this.values.action    = 'login';
            __this.values.userEmail = __this.normalize(__this.userEmail.value.trim());
            __this.values.userPass  = __this.normalize(__this.userPass.value.trim());

            __this.checkLogForm() ? __this.logIn() : __this.logErr.style.display = 'block';
        }
    }

    logIn () {
        var ajax = new Ajax;
        var __this = this;

        var ajaxReq = {
            type: 'POST',
            body: this.values
        };
        // !! dev !!
        console.log(ajaxReq.body);
        ajax.sendRequest('http://localhost:3000/login', ajaxReq , function (data) {
            if (data)
                document.location.href = 'http://localhost:3000/profile';
            else
                __this.logErr.style.display = 'block';
            console.log(data ? data : 0);
        });
    }

    checkLogForm () {
        if (this.values.userEmail && this.userEmail.checkValidity() && this.values.userPass) {
            console.log('Login form passed validation');
            return (true);
        } else {
            console.log('Login form didn`t passed  validation');
            return (false);
        }
    }
}

class RegForm extends Form {
    constructor () {
        console.log('reg form created !');
        super();
        this.logform                = {};
        this.logform.userName       = document.querySelectorAll('input[name=\"name_reg\"]')[0];
        this.logform.userSurname    = document.querySelectorAll('input[name=\"surname_reg\"]')[0];
        this.logform.userCountry    = document.querySelectorAll('input[name=\"country\"]')[0];
        this.logform.userCity       = document.querySelectorAll('input[name=\"city\"]')[0];
        this.logform.userEmail      = document.querySelectorAll('input[name=\"email\"]')[0];
        this.logform.userPassword   = document.querySelectorAll('input[name=\"pass_new\"]')[0];
        this.logform.userPasswordRe = document.querySelectorAll('input[name=\"pass_new_re\"]')[0];
        this.regBtnSubmit           = document.getElementsByClassName('if_submit_reg')[0];
        this.logform.userAge        = '18';
        this.geoposition            = [];

        var __this = this;

        __this.getGeoposition();

        this.vueInit();

        __this.addHandler(__this.regBtnSubmit, 'click', function () {
            if (__this.checkRegForm() == 0) {
                console.log('send Ajax Request');
                var body = {};
                body.action = 'registration';

                for (var key in __this.logform) {
                    body[key] = (key != 'userAge' ? __this.normalize(__this.logform[key].value.trim()) : __this.logform[key]);
                }
                (Object.keys(__this.geoposition).length == 0) ? __this.getGeopositionFromForm(body) :  __this.sendUserData(body);
            }
        });
    }

    vueInit () {
        var age = [];
        var __this = this;

        for (var i = 0, ageCounter = 18; i < 82; i++, ageCounter++) {age[i] = ageCounter;}

        new Vue({
            el      : document.querySelectorAll('.age-dropdown .dropdown-age-list')[0],
            data    : {
                ageList: age
            },
            methods : {
                getAge : function () {
                    __this.logform.userAge = event.target.getAttribute('data');
                }
            }
        });
    }
    getGeopositionFromForm(body) {
        var geocoder;
        var __this = this;
        initialize();
        codeAddress(this.logform.userCountry.value + ", " + this.logform.userCity.value);

        function initialize() {
            geocoder = new google.maps.Geocoder();
            var latlng = new google.maps.LatLng(-34.397, 150.644);
        }

        function codeAddress(address) {
            geocoder.geocode( { 'address': address}, function(results, status) {
                if (status == 'OK') {
                    __this.geoposition[0]           = results[0].geometry.location.lat();
                    __this.geoposition[1]           = results[0].geometry.location.lng();
                    __this.sendUserData(body);
                } else {
                    console.log('ERR, Geocode was not successful for the following reason: ' + status)
                }
            });
        }
    }
    getGeoposition () {
        var __this = this;
        if(geo_position_js.init())
        {
            geo_position_js.getCurrentPosition (
                show_position,
                function(){
                    console.log("ERR, permission denied, couldn`t get location");
                },{
                    enableHighAccuracy:true
                }
            );
        }
        else
            return (null);

        function show_position (p) {
            __this.geoposition[0]           = {};
            __this.geoposition[1]           = {};
            __this.geoposition[0]           = p.coords.latitude;
            __this.geoposition[1]           = p.coords.longitude;

        }
    }
    sendUserData (body) {
        var ajax = new Ajax;
        var __this = this;
        body.latitude = this.geoposition[0];
        body.longitude = this.geoposition[1];

        var ajaxReq = {
            type: 'POST',
            body: body
        };
        // dev
        console.log(ajaxReq.body);
        ajax.sendRequest('http://localhost:3000/login', ajaxReq , function (data) {
            if (data.status == 'added') {
                __this.successMsg.style.display = 'block';
                setTimeout(function () {
                    __this.closeReg();
                },6000)
            }
            console.log(data ? data : 0);
        });
    }
    checkRegForm () {
        var checked = 0;
        var radio   = {
            all             : document.querySelectorAll('.reg-checkbox-wrap input'),
            sex             : null,
            sexOrientation  : null
        }

        for (var i = 0; i < 4; i++) {radio.all[i].checked == true ? radio.sexOrientation = radio.all[i] : 0;}
        for (var i = 4; i < radio.all.length; i++) {radio.all[i].checked == true ? radio.sex = radio.all[i] : 0;}

        this.logform.userSex            = radio.sex;
        this.logform.userSexOrientation = radio.sexOrientation;

        !this.checkPasswords() ? checked = 1 : 0;
        (radio.sexOrientation && radio.sex) ? 0 : checked = 1;

        for (var key in this.logform) {
            if (key == 'userAge')
                continue ;
            else if (this.logform[key].value.trim())
                this.logform[key].checkValidity() != true ? checked = 1 : 0;
            else
                checked = 1;
        }

        console.log('Reg form '+(checked == 1 ? 'didnt passed' : 'passed')+' validation');
        return (checked);
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

window.onload = function() {
    var form    = new Form;
    var logForm = new LogForm;
    var regForm;

    form.btnOpenReg.onclick = function() {
        form.openReg();
        regForm = new RegForm;

    }

    form.btnCloseReg.onclick = function() {
        form.closeReg();
        logForm = new LogForm;
    }

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
