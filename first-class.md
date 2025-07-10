---
title: First class info
permalink: /first-class.html
layout: default
button_text: "Book a class!"
button_url: "https://allseasonsfitness.as.me"
---

# First Class Discount!

Welcome, we're glad you're here! Your first class is only $10! 

Purchase + book your session below with the code "FIRSTCLASS!" to get your first class discount!

Keep an eye out for a Facebook message from me beforehand as I’ll connect before your first class.

<div id="acuity-schedule-container">
    <iframe class="acuity-iframe" src="" width="100%" height="800" frameBorder="0"></iframe>
    <div id="loading-indicator">Loading the schedule...</div>
    <script src="https://embed.acuityscheduling.com/js/embed.js" type="text/javascript"></script>
    <script>
        const iframeEle = document.getElementsByClassName('acuity-iframe')[0];
        console.log('iframe: ', iframeEle);
        const loadingEle = document.getElementById('loading-indicator');
        iframeEle.addEventListener('load', function() {
            loadingEle.style.display = 'none';
        });
        iframeEle.src = "https://allseasonsfitness.as.me/schedule/d78d06ae/appointment/75677355/calendar/any?certificate=FIRSTCLASS!";
    </script>
</div>

Having issues? [Just message me directly](index.html#contact). Happy to help!