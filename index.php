<!DOCTYPE html>
<html lang="en">
<head>
    <title>zanex.dev</title>
    <meta charset="UTF-8">
    <meta type="description" content="Hey! Im a jr. Software engineer that doesnt rly know what he's doing! Here you can find all my socials and relevant links.">

    <!-- -- CSS Dependencies -- -->
    <link rel="stylesheet" href="./main/deps/Bootstrap/css/bootstrap.min.css">
    <link rel="stylesheet" href="./main/deps/jQuery/jquery-ui.css">

    <!-- -- JS Dependencies -- -->
    <script src="./main/deps/Bootstrap/js/bootstrap.min.js"></script>
    <script src="./main/deps/jQuery/external/jquery/jquery.js"></script>
    <script src="./main/deps/jQuery/jquery-ui.js"></script>
    <script src="./main/deps/jQuery/addons/touch-punch.js"></script> <!-- Add this line -->
</head>
<body>
<script>
    $(document).ready(function() {
        $( ".window" ).draggable({
            handle: ".header"
        });
    });
</script>


<style>
    .window {
        width: 200px;
        height: 200px;
        background-color: #f1f1f1;
        transform: translate3d(0,0,0);
    }

    .header {
        width: 200px;
        height: 50px;
        background-color: #999;
        text-align: center;
        line-height: 50px;
        cursor: move;
    }

    .content {
        padding: 10px;
    }
</style>

<div class="window">
    <div class="header">zanex.dev</div>
    <div class="content">This is just a basic setup.</div>
</div>
</body>
</html>
