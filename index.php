<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>zanex.dev</title>

    <!-- ---- All local imports ---- -->

    <!-- FavIcon collection -->
    <link rel="icon" type="image/x-icon" href="./zanex/img/favicons/favicon.ico">
    <link rel="icon" type="image/png" sizes="16x16" href="./zanex/img/favicons/favicon-16x16.png">
    <link rel="icon" type="image/png" sizes="32x32" href="./zanex/img/favicons/favicon-32x32.png">
    <link rel="apple-touch-icon" sizes="180x180" href="./zanex/img/favicons/apple-touch-icon.png">
    <link rel="icon" type="image/png" sizes="192x192" href="./zanex/img/favicons/android-chrome-192x192.png">
    <link rel="icon" type="image/png" sizes="512x512" href="./zanex/img/favicons/android-chrome-512x512.png">

    <!-- Custom -->
    <link rel="stylesheet" href="./zanex/main/css/Style.css">
    <script src="./zanex/main/js/Script.js"></script>

    <!-- Bootstrap -->
    <script src="zanex/Bootstrap/js/bootstrap.js"></script>
    <link rel="stylesheet" href="zanex/Bootstrap/css/bootstrap.css">

    <!-- --------------------------- -->



    <!-- ---- Online Imports ---- -->

    <!-- ----------- -->
    <!-- tsParticles -->
    <!-- ----------- -->
    <script src="https://cdn.jsdelivr.net/npm/tsparticles@2.9.3/tsparticles.bundle.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/tsparticles-path-polygon@2.9.3/tsparticles.path.polygon.min.js"></script>

    <!-- ----------- -->
    <!-- FontAwesome -->
    <!-- ----------- -->
    <script src="https://kit.fontawesome.com/6030e63832.js" crossorigin="anonymous"></script>

    <!-- ------------------------ -->

    <script>
        /* ---- Animated Website Title ---- */

        title = "zanex.dev                \n";
        position = 0;

        function scrolltitle() {
            document.title = title.substring(position, title.length) + title.substring(0, position);
            position++;
            if (position > title.length) position = 0;
            titleScroll = window.setTimeout(scrolltitle, 170);
        }
        scrolltitle();

        /* -------------------------------- */



        /* ---- Deactivate Right-Click ---- */

        document.addEventListener('contextmenu', event => event.preventDefault());

        /* -------------------------------- */
    </script>

    <script>
        tsParticles.load("tsparticles", "./tsParticles/Config.js").then((container) => {
            container.setBackgroundColor("#000");
            container.fullScreen.zIndex = -1;

            container.start();
        });
    </script>
</head>
<body>
<!-- ---- Title and Buttons/Links using Bootstrap-5 ---- -->

<main id="main">
    <div class="container-fluid">
        <div class="row">
            <div class="col-sm-12">
                <div id="title">
                    <h1>zanex.dev</h1>
                </div>
            </div>
        </div>

        <div class="row">
            <div class="col-sm-12">
                <div id="links">
                    <a class="github-link" onclick="window.open('https://github.com/zanexGHG')">
                        <i class="fa-brands fa-github"></i>
                    </a>

                    <a class="youtube-link" onclick="window.open('https://www.youtube.com/@zanexGHG')">
                        <i class="fa-brands fa-youtube"></i>
                    </a>

                    <a class="discord-link" onclick="window.open('https://discord.gg/MCNFVvvUEg')">
                        <i class="fa-brands fa-discord"></i>
                    </a>

                    <a class="reddit-link" onclick="window.open('https://www.reddit.com/user/zanexGHG')">
                        <i class="fa-brands fa-reddit"></i>
                    </a>

                    <a class="buymeacoffee-link" onclick="window.open('https://www.buymeacoffee.com/zanexghg')">
                        <i class="fa-solid fa-mug-hot"></i>
                    </a>
                </div>
            </div>
        </div>
    </div>
</main>

<!-- --------------------------------------------------- -->


<!-- ---- Load tsParticles backgroun ---- -->

<canvas data-generated="true" style="width: 100% !important; height: 100% !important; position: fixed !important; z-index: -1 !important; top: 0px !important; left: 0px !important; background-color: rgb(0, 0, 0); pointer-events: none;" aria-hidden="true" width="958" height="456"></canvas>
<script src="./zanex/tsParticles/Config.js"></script>

<!-- ------------------------------------ -->
</body>
</html>