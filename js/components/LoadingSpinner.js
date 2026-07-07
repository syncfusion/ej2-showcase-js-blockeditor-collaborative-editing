(function (App) {
    'use strict';

    /**
     * Create and show a loading spinner inside the given container.
     *
     * @param {HTMLElement} container - The element to render the spinner into.
     * @param {string} [text] - Optional loading message text.
     * @returns {{ destroy: function }}
     */
    function LoadingSpinner(container, text) {
        var loadingText = text || 'Initializing collaboration...';

        container.innerHTML = '';

        var loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading-container';

        var spinnerHost = document.createElement('div');
        spinnerHost.className = 'spinner-host';

        var loadingPara = document.createElement('p');
        loadingPara.className = 'loading-text';
        loadingPara.textContent = loadingText;

        loadingDiv.appendChild(spinnerHost);
        loadingDiv.appendChild(loadingPara);
        container.appendChild(loadingDiv);

        ej.popups.createSpinner({ target: spinnerHost });
        ej.popups.showSpinner(spinnerHost);

        return {
            destroy: function () {
                ej.popups.hideSpinner(spinnerHost);
                if (container.contains(loadingDiv)) {
                    container.removeChild(loadingDiv);
                }
            }
        };
    }

    App.LoadingSpinner = LoadingSpinner;

})(window.App = window.App || {});
