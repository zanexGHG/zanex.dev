/* -- Make windows draggable -- */
$(document).ready(function() {
    $( ".window" ).draggable({
        handle: ".header",
        containment: "body",
    });
});