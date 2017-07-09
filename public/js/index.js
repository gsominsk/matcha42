window.onload = function () {

/*
** ==========================================
**          main-slider text fadeout
** ==========================================
*/
    $('.active .carousel-caption').fadeTo("slow", 1)
    $('#mainCarousel').on('slid.bs.carousel', function () {
        $('.active .carousel-caption').fadeTo("slow", 1)
    })
    $('#mainCarousel').on('slide.bs.carousel', function () {
        $('.active .carousel-caption').fadeTo("slow", 0)
    })
}
