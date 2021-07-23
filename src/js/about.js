$(function() {
    $('#whatis a').click(function() {
        $('#info').slideToggle(0)
                  .css('height', $('#info').height())
                  .slideToggle(0)
                  .slideToggle();
        return false;
    });
});
