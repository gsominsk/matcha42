class Slider {
    constructor (params) {
        this.showHideCaption();
        $('#mainCarousel').on('slid.bs.carousel', this.showHideCaption);
        $('#mainCarousel').on('slide.bs.carousel', this.showHideCaption)
    }

	showHideCaption(action) {
		$('.active .carousel-caption').fadeTo("slow", 1)
	}
}
