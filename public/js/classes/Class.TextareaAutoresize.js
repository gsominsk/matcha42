class TextareaAutoresize {
    constructor (params) {
        this.observe;
        if (window.attachEvent) {
            this.observe = function (element, event, handler) {
                element.attachEvent('on'+event, handler);
            };
        }
        else {
            this.observe = function (element, event, handler) {
                element.addEventListener(event, handler, false);
            };
        }
        this.init();
    }

    init () {
        var textarea = document.getElementsByClassName('textareaAutoresize');

        for (var i = 0; i < textarea.length; i++) {
            this.observe(textarea[i], 'change',  resize);
            this.observe(textarea[i], 'cut',     delayedResize);
            this.observe(textarea[i], 'paste',   delayedResize);
            this.observe(textarea[i], 'drop',    delayedResize);
            this.observe(textarea[i], 'keydown', delayedResize);

            textarea[i].focus();
            textarea[i].select();
            resize(textarea[i]);
        }

        function resize (elem) {
            elem.style.height = 'auto';
            elem.style.height = elem.scrollHeight+'px';
        }

        /* 0-timeout to get the already changed text */
        function delayedResize () {
            window.setTimeout(resize, 0);
        }
    }
}
