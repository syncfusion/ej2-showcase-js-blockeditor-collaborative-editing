(function (App) {
    'use strict';

    /**
     * Render the hero section into the given container element.
     * @param {HTMLElement} container
     */
    function Hero(container) {
        container.innerHTML = [
            '<section class="hero">',
            '  <div class="hero-container">',
            '    <h1 class="hero-title">Real-time Collaborative Block Editor</h1>',
            '    <p class="hero-subtitle">',
            '      Collaborate effortlessly with multiple users in real time using the Syncfusion Block Editor.',
            '    </p>',
            '  </div>',
            '</section>'
        ].join('\n');
    }

    App.Hero = Hero;

})(window.App = window.App || {});
