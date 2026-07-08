(function (App) {
    'use strict';

    /**
     * Download a Blob as a file.
     */
    function downloadFile(blob, filename) {
        var url = URL.createObjectURL(blob);
        var link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    /**
     * Render the editor container with toolbar and BlockEditor.
     *
     * @param {HTMLElement} container
     * @param {object} config - {
     *   roomId, isConnected, collaboratorCount,
     *   blocks, users, currentUserId, collaborationSettings,
     *   onPanelToggle, onCreated,
     *   inlineToolbarSettings, imageBlockSettings
     * }
     * @returns {{ editor: BlockEditor, update: function(config) }}
     */
    function EditorContainer(container, config) {
        var currentConfig = Object.assign({}, config);
        var editor = null;
        var toolbar = null;
        var connectionStatusComponent = null;
        var collaborationOptionComponent = null;
        var peopleBtnHost = null;
        var peopleBtn = null;

        // Build container structure
        var editorContainer = document.createElement('div');
        editorContainer.className = 'editor-container';

        var toolbarArea = document.createElement('div');
        toolbarArea.className = 'toolbar-area';

        var toolbarHost = document.createElement('div');
        toolbarHost.id = 'editor-toolbar';
        toolbarArea.appendChild(toolbarHost);

        var editorArea = document.createElement('div');
        editorArea.className = 'editor-area';

        var blockEditorHost = document.createElement('div');
        blockEditorHost.id = 'block-editor';
        editorArea.appendChild(blockEditorHost);

        editorContainer.appendChild(toolbarArea);
        editorContainer.appendChild(editorArea);
        container.appendChild(editorContainer);

        // --- Build Left toolbar content ---
        var leftWrapper = document.createElement('div');
        leftWrapper.className = 'collaboration-toolbar-wrapper';

        var sectionLeft = document.createElement('div');
        sectionLeft.className = 'toolbar-section-left';

        var sectionRight = document.createElement('div');
        sectionRight.className = 'toolbar-section-right';

        leftWrapper.appendChild(sectionLeft);
        leftWrapper.appendChild(sectionRight);

        // --- Build Right toolbar content ---
        var rightWrapper = document.createElement('div');
        rightWrapper.className = 'toolbar-right';

        peopleBtnHost = document.createElement('button');
        rightWrapper.appendChild(peopleBtnHost);

        // Export DropDownButton
        var exportBtnHost = document.createElement('button');
        rightWrapper.appendChild(exportBtnHost);

        // Panel toggle DropDownButton
        var panelBtnHost = document.createElement('button');
        rightWrapper.appendChild(panelBtnHost);

        // Initialize Toolbar
        toolbar = new ej.navigations.Toolbar({
            cssClass: 'editor-toolbar',
            items: [
                {
                    type: 'Input',
                    template: leftWrapper,
                    align: 'Left'
                },
                {
                    type: 'Input',
                    template: rightWrapper,
                    align: 'Right'
                }
            ]
        });
        toolbar.appendTo(toolbarHost);

        // Initialize CollaborationOption
        collaborationOptionComponent = App.CollaborationOption(sectionLeft, {
            roomId: currentConfig.roomId
        });

        // Initialize ConnectionStatus
        connectionStatusComponent = App.ConnectionStatus(sectionRight, currentConfig.isConnected);

        // People count button
        peopleBtn = new ej.buttons.Button({
            iconCss: 'e-icons e-people',
            cssClass: 'e-small e-info',
            content: (currentConfig.collaboratorCount || 1) + ' ' + ((currentConfig.collaboratorCount || 1) === 1 ? 'person' : 'people')
        });
        peopleBtn.appendTo(peopleBtnHost);

        // Export DropDownButton
        var exportItems = [
            { text: 'Export as JSON', id: 'export-json', iconCss: 'e-icons e-download' },
            { text: 'Export as HTML', id: 'export-html', iconCss: 'e-icons e-download' },
            { text: 'Export as Markdown', id: 'export-markdown', iconCss: 'e-icons e-download' }
        ];
        var exportDdb = new ej.splitbuttons.DropDownButton({
            items: exportItems,
            cssClass: 'export-button e-small',
            iconCss: 'e-icons e-download',
            content: 'Export',
            select: function (args) {
                handleExport(args);
            }
        });
        exportDdb.appendTo(exportBtnHost);

        // Panel toggle DropDownButton
        var panelItems = [
            { text: 'Active Collaborators', id: 'show-collaborators', iconCss: 'e-icons e-people' },
            { text: 'Version History', id: 'show-versions', iconCss: 'e-icons e-history' }
        ];
        var panelDdb = new ej.splitbuttons.DropDownButton({
            items: panelItems,
            cssClass: 'panel-toggle-dropdown e-caret-hide e-small',
            iconCss: 'e-icons e-more-vertical-2',
            select: function (args) {
                handlePanelToggle(args);
            }
        });
        panelDdb.appendTo(panelBtnHost);

        function handleExport(args) {
            if (!editor) return;
            var selected = (args.item.text || '').toLowerCase();
            var format = selected.indexOf('json') !== -1 ? 'json' :
                (selected.indexOf('markdown') !== -1 ? 'markdown' : 'html');
            try {
                if (format === 'json') {
                    var data = editor.getDataAsJson();
                    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                    downloadFile(blob, 'editor-' + Date.now() + '.json');
                } else if (format === 'html') {
                    var htmlData = editor.getDataAsHtml();
                    var htmlBlob = new Blob([htmlData], { type: 'text/html' });
                    downloadFile(htmlBlob, 'editor-' + Date.now() + '.html');
                } else if (format === 'markdown') {
                    var htmlContent = editor.getDataAsHtml();
                    var markdownContent = App.TurndownService.turndown(htmlContent || '');
                    var mdBlob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
                    downloadFile(mdBlob, 'editor-' + Date.now() + '.md');
                }
            } catch (error) {
                console.error('Export failed:', error);
            }
        }

        function handlePanelToggle(args) {
            var action = args.item.id;
            if (currentConfig.onPanelToggle) {
                if (action === 'show-collaborators') {
                    currentConfig.onPanelToggle('collab');
                } else if (action === 'show-versions') {
                    currentConfig.onPanelToggle('versions');
                }
            }
        }

        // Initialize BlockEditor
        var editorConfig = {
            id: 'block-editor',
            height: '600px',
            width: 'auto',
            blocks: currentConfig.blocks,
            users: currentConfig.users,
            currentUserId: currentConfig.currentUserId,
            collaborationSettings: currentConfig.collaborationSettings,
            created: function () {
                if (currentConfig.onCreated) {
                    currentConfig.onCreated(editor);
                }
            },
            inlineToolbarSettings: currentConfig.inlineToolbarSettings,
            imageBlockSettings: currentConfig.imageBlockSettings
        };

        // Inject Collaboration and VersionHistory services
        ej.blockeditor.BlockEditor.Inject(ej.blockeditor.Collaboration, ej.blockeditor.VersionHistory);
        editor = new ej.blockeditor.BlockEditor(editorConfig);
        editor.appendTo(blockEditorHost);

        function update(newConfig) {
            currentConfig = Object.assign(currentConfig, newConfig);

            if (connectionStatusComponent && newConfig.isConnected !== undefined) {
                connectionStatusComponent.update(newConfig.isConnected);
            }

            if (peopleBtn && newConfig.collaboratorCount !== undefined) {
                var count = newConfig.collaboratorCount;
                peopleBtn.content = count + ' ' + (count === 1 ? 'person' : 'people');
                peopleBtn.dataBind();
            }

            if (editor && newConfig.users !== undefined) {
                editor.users = newConfig.users;
                editor.dataBind();
            }
        }

        return { editor: editor, update: update };
    }

    App.EditorContainer = EditorContainer;

})(window.App = window.App || {});
