(function (App) {
    'use strict';

    /**
     * Render a connection status indicator inside the given container.
     *
     * @param {HTMLElement} container
     * @param {boolean} isConnected
     * @returns {{ update: function(boolean) }}
     */
    function ConnectionStatus(container, isConnected) {
        var wrapper = document.createElement('div');
        wrapper.className = 'connection-status';

        var indicator = document.createElement('span');
        indicator.className = 'status-indicator';

        var statusText = document.createElement('span');
        statusText.className = 'status-text';

        wrapper.appendChild(indicator);
        wrapper.appendChild(statusText);
        container.appendChild(wrapper);

        function update(connected) {
            if (connected) {
                indicator.className = 'status-indicator connected';
                statusText.textContent = 'Connected';
            } else {
                indicator.className = 'status-indicator disconnected';
                statusText.textContent = 'Connecting...';
            }
        }

        update(isConnected);

        return { update: update };
    }

    App.ConnectionStatus = ConnectionStatus;

})(window.App = window.App || {});
