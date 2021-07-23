$(function() {
    $('#eye1').css({ left: 78, top: 12 }).removeAttr('hidden');
    $('#eye2').css({ left: 87, top: 16 }).removeAttr('hidden');
    $('#eye3').css({ left: 105, top: 16 }).removeAttr('hidden');
    $('#eye4').css({ left: 121, top: 12 }).removeAttr('hidden');
    $(document).mousemove(function(event) {
        $('#logo img').each(function() {
            var dx = event.pageX - $(this).offset().left - $(this).width() / 2,
                dy = event.pageY - $(this).offset().top - $(this).height() / 2,
                transform = 'rotate(' + Math.atan2(dx, -dy) + 'rad)';
            // jQuery handles prefixes for us. Also browsers are
            // unprefixing this anyway.
            $(this).css({ transform: transform });
        });
    });
});
