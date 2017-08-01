class Anchor {
    constructor (params) {
        this.anchorBtns = document.querySelectorAll('.main-anchor a');

        this.anchorBtns[0].onclick = this.showSection;
        this.anchorBtns[1].onclick = this.showSection;
        this.anchorBtns[2].onclick = this.showSection;
        this.anchorBtns[3].onclick = this.showSection;

        /* Gecko */
        this.addHandler(window, 'DOMMouseScroll', this.wheel);
        /* Opera */
        this.addHandler(window, 'mousewheel', this.wheel);
        /* IE */
        this.addHandler(document, 'mousewheel', this.wheel);
    }

    showSection () {
		document.querySelectorAll('.main-anchor .active')[0].classList.remove('active');
        this.classList.add('active');
    }

    addHandler(object, event, handler, useCapture) {
        if (object.addEventListener) {
            object.addEventListener(event, handler, useCapture ? useCapture : false);
        } else if (object.attachEvent) {
            object.attachEvent('on' + event, handler);
        } else alert("Add handler is not supported");
    }

    wheel(event) {
        var sectionPositions = [];
		var position = document.getElementsByClassName('container')[0].scrollTop;
        for (var i = 0, h = 0; i < document.querySelectorAll('.row').length; i++) {
            h += document.querySelectorAll('.row')[i].getBoundingClientRect().height;
            sectionPositions[i] = h;
        }

        (position + 150) >= 0 && position < sectionPositions[0] ? hideAnchor() : 0;
        (position + 450) >= sectionPositions[0] && position <= sectionPositions[1] ? changeActiveAnchor(1) : 0;
        (position + 150) >= sectionPositions[1] && position <= sectionPositions[2] ? changeActiveAnchor(2) : 0;
        (position + 150) >= sectionPositions[2] && position < sectionPositions[3] ? changeActiveAnchor(3) : 0;

        function changeActiveAnchor (activeElem) {
            document.querySelectorAll('.main-anchor')[0].style.opacity = "1";
            document.querySelectorAll('.main-anchor .active')[0].classList.remove('active');
            document.querySelectorAll('.main-anchor a')[activeElem].classList.add('active');
        }

        function hideAnchor () {
            document.querySelectorAll('.main-anchor')[0].style.opacity = "0";
        }
    }
}
