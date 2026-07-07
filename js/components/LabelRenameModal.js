(function (App) {
    'use strict';

    /**
     * Create a label rename modal (custom overlay, NOT an EJ2 Dialog).
     *
     * @param {string} [title] - Dialog title
     * @returns {{ show: function(id, initialValue, onSave), hide: function }}
     */
    function LabelRenameModal(title) {
        var dialogTitle = title || 'Rename Snapshot';
        var currentId = null;
        var onSaveCallback = null;
        var textBox = null;
        var currentValue = '';

        // Build overlay
        var overlay = document.createElement('div');
        overlay.className = 'rename-dialog-overlay';
        overlay.style.display = 'none';

        var dialog = document.createElement('div');
        dialog.className = 'rename-dialog';
        dialog.setAttribute('role', 'dialog');
        dialog.setAttribute('aria-modal', 'true');

        // Header
        var header = document.createElement('div');
        header.className = 'rename-dialog-header';

        var titleSpan = document.createElement('span');
        titleSpan.textContent = dialogTitle;

        var closeBtnHost = document.createElement('button');
        header.appendChild(titleSpan);
        header.appendChild(closeBtnHost);

        // Body
        var body = document.createElement('div');
        body.className = 'rename-dialog-body';

        var textBoxHost = document.createElement('input');
        textBoxHost.type = 'text';
        body.appendChild(textBoxHost);

        // Footer
        var footer = document.createElement('div');
        footer.className = 'rename-dialog-footer';

        var cancelBtnHost = document.createElement('button');
        var saveBtnHost = document.createElement('button');
        footer.appendChild(cancelBtnHost);
        footer.appendChild(saveBtnHost);

        dialog.appendChild(header);
        dialog.appendChild(body);
        dialog.appendChild(footer);
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        // Close button
        var closeBtn = new ej.buttons.Button({ cssClass: 'e-small' });
        closeBtn.appendTo(closeBtnHost);
        closeBtnHost.textContent = '×';
        closeBtnHost.addEventListener('click', hide);

        // Cancel button
        var cancelBtn = new ej.buttons.Button({ cssClass: 'e-small', content: 'Cancel' });
        cancelBtn.appendTo(cancelBtnHost);
        cancelBtnHost.addEventListener('click', hide);

        // Save button
        var saveBtn = new ej.buttons.Button({ cssClass: 'e-small', isPrimary: true, content: 'Save' });
        saveBtn.appendTo(saveBtnHost);
        saveBtnHost.addEventListener('click', function () {
            if (currentValue.trim() && onSaveCallback) {
                onSaveCallback(currentId, currentValue.trim());
            }
            hide();
        });

        // TextBox
        textBox = new ej.inputs.TextBox({
            placeholder: 'Enter snapshot label',
            cssClass: 'rename-input-field',
            input: function () {
                currentValue = textBox.value || '';
            },
            change: function (e) {
                currentValue = e.value || '';
            }
        });
        textBox.appendTo(textBoxHost);

        // Keyboard handler
        textBoxHost.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && currentValue.trim()) {
                if (onSaveCallback) {
                    onSaveCallback(currentId, currentValue.trim());
                }
                hide();
            } else if (e.key === 'Escape') {
                hide();
            }
        });

        function show(id, initialValue, onSave) {
            currentId = id;
            currentValue = initialValue || '';
            onSaveCallback = onSave || null;
            textBox.value = currentValue;
            overlay.style.display = 'flex';
            setTimeout(function () {
                textBoxHost.focus();
                textBoxHost.select();
            }, 50);
        }

        function hide() {
            overlay.style.display = 'none';
            currentId = null;
            onSaveCallback = null;
        }

        return {
            show: show,
            hide: hide,
            destroy: function () {
                if (document.body.contains(overlay)) {
                    document.body.removeChild(overlay);
                }
            }
        };
    }

    App.LabelRenameModal = LabelRenameModal;

})(window.App = window.App || {});
