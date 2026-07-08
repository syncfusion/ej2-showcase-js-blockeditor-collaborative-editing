(function (App) {
    'use strict';

    /**
     * Render the collaboration URL sharing toolbar into the given container.
     *
     * @param {HTMLElement} container
     * @param {object} config - { roomId: string }
     * @returns {{}}
     */
    function CollaborationOption(container, config) {
        var copied = false;
        var copyTimer = null;
        var collaborationUrl = App.UrlHelpers.getCollaborationUrl(config.roomId);

        // Label
        var label = document.createElement('label');
        label.htmlFor = 'collab-url';
        label.className = 'toolbar-label';
        label.textContent = '⚡ Share Collaboration URL';

        // Room URL container
        var urlContainer = document.createElement('div');
        urlContainer.className = 'room-url-container';

        // TextBox host
        var textBoxHost = document.createElement('input');
        textBoxHost.id = 'collab-url';
        textBoxHost.type = 'text';
        urlContainer.appendChild(textBoxHost);

        // Copy button host
        var copyBtnHost = document.createElement('button');
        urlContainer.appendChild(copyBtnHost);

        container.appendChild(label);
        container.appendChild(urlContainer);

        // Initialize TextBox
        var textBox = new ej.inputs.TextBox({
            value: collaborationUrl,
            readonly: true,
            cssClass: 'e-small',
            width: '320px'
        });
        textBox.appendTo(textBoxHost);

        // Initialize copy Button
        var copyBtn = new ej.buttons.Button({
            cssClass: 'copy-button e-small',
            iconCss: 'e-icons e-copy'
        });
        copyBtn.appendTo(copyBtnHost);
        copyBtn.element.setAttribute("title", "Copy collaboration link");

        copyBtnHost.addEventListener('click', function () {
            App.UrlHelpers.copyToClipboard(collaborationUrl).then(function () {
                if (copied) return;
                copied = true;
                copyBtnHost.querySelector('.e-btn-icon').className = 'e-btn-icon e-icons e-check';
                if (copyTimer) clearTimeout(copyTimer);
                copyTimer = setTimeout(function () {
                    copied = false;
                    copyBtnHost.querySelector('.e-btn-icon').className = 'e-btn-icon e-icons e-copy';
                }, 2000);
            }).catch(function (err) {
                console.error('Failed to copy link:', err);
            });
        });

        return {};
    }

    App.CollaborationOption = CollaborationOption;

})(window.App = window.App || {});
