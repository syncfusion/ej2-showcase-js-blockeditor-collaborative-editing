
(function (App) {
    'use strict';
    
    var HOSTED_WS_URL = 'https://collab.syncfusion.com';

    // yjs-collab-bundle.js exposes window.Y (Yjs) and window.WebsocketProvider (y-websocket) — single shared instance
    var Y = window.Y;
    var WebsocketProvider = window.WebsocketProvider;

    /**
     * Initialize the complete collaboration setup for a room.
     *
     * @param {string} roomName - The room identifier.
     * @param {function} onReady - Callback invoked when sync is ready: onReady(ydoc, provider, adapter)
     * @returns {{ destroy: function }} - Object with destroy method to clean up resources.
     */
    function init(roomName, onReady) {
        var ydoc = new Y.Doc();
        var yXmlFragment = ydoc.getXmlFragment('blockeditor');
        var provider = new WebsocketProvider(HOSTED_WS_URL, roomName, ydoc);
        var adapter = {
            yRuntime: Y,
            yXmlFragment: yXmlFragment
        };

        var syncInterval = null;
        var resolved = false;

        function resolve() {
            if (resolved) return;
            resolved = true;
            if (syncInterval !== null) {
                clearInterval(syncInterval);
                syncInterval = null;
            }
            onReady(ydoc, provider, adapter);
        }

        // isSynced behaviour: poll provider.synced every 100ms
        // and only call onReady once the provider confirms it has synced.
        syncInterval = setInterval(function () {
            if (provider.synced) {
                resolve();
            }
        }, 100);

        return {
            destroy: function () {
                if (syncInterval !== null) clearInterval(syncInterval);
                provider.disconnect();
                ydoc.destroy();
            }
        };
    }

    /**
     * Register a live connection status change listener.
     *
     * @param {object} provider - WebsocketProvider instance.
     * @param {function} callback - Called with (isConnected: boolean) on status change.
     * @returns {{ destroy: function }}
     */
    function onStatusChange(provider, callback) {
        function handleStatus(event) {
            callback(event.status === 'connected');
        }
        provider.on('status', handleStatus);
        return {
            destroy: function () {
                provider.off('status', handleStatus);
            }
        };
    }

    /**
     * Get current connection status.
     */
    function getConnectionStatus(provider) {
        return provider.wsconnected || false;
    }

    App.Collaboration = {
        init: init,
        onStatusChange: onStatusChange,
        getConnectionStatus: getConnectionStatus
    };

})(window.App = window.App || {});
