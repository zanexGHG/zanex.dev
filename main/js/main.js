$(document).ready(function() {
    /* -- Make windows draggable -- */
    $( "#window" ).draggable({
        handle: "#window-bar",
        containment: "body",
    });

    /* -- Make window closeable -- */
    $( "#window-bar-close" ).click(function() {
        $( "#window" ).hide();
    });

    /* -- Make window minimizable -- */
    $( "#window-bar-minimize" ).click(function() {
        $( "#window" ).hide();
        $( "#window-minimized" ).show();
    });

    /* -- Make window maximizable -- */
    $( "#window-bar-maximize" ).click(function() {
        if ($( "#window" ).hasClass('window-maximized')) {
            $( "#window" ).animate({
                width: "800px",
                height: "600px"
            }, 500);
        } else {
            $( "#window" ).animate({
                width: "100vw",
                height: "100vh"
            }, 500);
        }
        $( "#window" ).toggleClass('window-maximized');
    });

    /* -- Comming soon window -- */
    $('#window-comming-soon-trigger').click(function() {
        $('#coming-soon-window').removeClass('hidden');
    });

    $('#coming-soon-window').click(function() {
        $(this).addClass('hidden');
    });
});