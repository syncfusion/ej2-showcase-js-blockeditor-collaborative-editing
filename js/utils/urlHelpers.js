(function (App) {
    'use strict';

    /**
     * Generate full collaboration URL with room ID.
     */
    function getCollaborationUrl(roomId) {
        var baseUrl = window.location.origin + window.location.pathname;
        return baseUrl + '#' + roomId;
    }

    /**
     * Copy text to clipboard. Returns a Promise.
     */
    function copyToClipboard(text) {
        if (navigator.clipboard && window.isSecureContext) {
            return navigator.clipboard.writeText(text);
        }

        // Fallback for non-secure contexts
        return new Promise(function (resolve, reject) {
            try {
                var textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                resolve();
            } catch (error) {
                console.error('Failed to copy to clipboard:', error);
                reject(error);
            }
        });
    }

    App.UrlHelpers = {
        getCollaborationUrl: getCollaborationUrl,
        copyToClipboard: copyToClipboard
    };

})(window.App = window.App || {});
