(function (App) {
    'use strict';

    /**
     * Render the main editor workspace (editor + sidebar).
     *
     * @param {HTMLElement} container
     * @param {object} config - {
     *   roomId, isConnected, currentUser, collaborators,
     *   blocks, users, currentUserId, collaborationSettings,
     *   snapshots, snapshotsLoading,
     *   onRestoreSnapshot, onDeleteSnapshot, onRenameSnapshot, onClearAllSnapshots,
     *   inlineToolbarSettings, imageBlockSettings, onCreated
     * }
     * @returns {{ update: function(newConfig) }}
     */
    function EditorWorkspace(container, config) {
        var currentConfig = Object.assign({}, config);
        var activePanel = null; // 'collab' | 'versions' | null
        var sidebar = null;
        var sidebarContentComponent = null;
        var editorContainerComponent = null;

        // Build section
        var section = document.createElement('section');
        section.className = 'editor-workspace';

        var innerDiv = document.createElement('div');

        var editorContainerArea = document.createElement('div');
        editorContainerArea.id = 'editor-container-area';

        var sidebarHost = document.createElement('div');
        sidebarHost.id = 'sidebar';
        sidebarHost.className = 'syncfusion-sidebar';

        innerDiv.appendChild(editorContainerArea);
        innerDiv.appendChild(sidebarHost);
        section.appendChild(innerDiv);
        container.appendChild(section);

        // Initialize EditorContainer first so the editor element exists before Sidebar is created
        editorContainerComponent = App.EditorContainer(editorContainerArea, {
            roomId: currentConfig.roomId,
            isConnected: currentConfig.isConnected,
            collaboratorCount: (currentConfig.collaborators ? currentConfig.collaborators.length : 0) + 1,
            blocks: currentConfig.blocks,
            users: currentConfig.users,
            currentUserId: currentConfig.currentUserId,
            collaborationSettings: currentConfig.collaborationSettings,
            inlineToolbarSettings: currentConfig.inlineToolbarSettings,
            imageBlockSettings: currentConfig.imageBlockSettings,
            onPanelToggle: function (panel) {
                handleTogglePanel(panel);
            },
            onCreated: function (editor) {
                if (currentConfig.onCreated) {
                    currentConfig.onCreated(editor);
                }
            }
        });

        var blockEditorEl = editorContainerArea.querySelector('#block-editor');
        var sidebarTarget = blockEditorEl ? blockEditorEl.parentElement : innerDiv;

        // Initialize Sidebar after EditorContainer so target element exists
        sidebar = new ej.navigations.Sidebar({
            type: 'Push',
            position: 'Right',
            width: '300px',
            showBackdrop: false,
            isOpen: false,
            target: sidebarTarget,
            created: function () {
                sidebar.element.style.visibility = '';
            },
            close: function () {
                activePanel = null;
                renderSidebarContent();
            }
        });
        sidebar.appendTo(sidebarHost);

        function handleTogglePanel(panel) {
            if (activePanel === panel) {
                // Close sidebar
                activePanel = null;
                sidebar.hide();
                renderSidebarContent();
            } else {
                activePanel = panel;
                renderSidebarContent();
                sidebar.show();
            }
        }

        function renderSidebarContent() {
            // Clear sidebar host content (except sidebar element itself)
            var sidebarEl = sidebar.element;

            // Remove old content inside sidebar element
            while (sidebarEl.firstChild) {
                sidebarEl.removeChild(sidebarEl.firstChild);
            }

            if (sidebarContentComponent && sidebarContentComponent.destroy) {
                sidebarContentComponent.destroy();
                sidebarContentComponent = null;
            }

            if (!activePanel) return;

            sidebarContentComponent = App.SidebarContent(sidebarEl, {
                mode: activePanel === 'collab' ? 'collaborators' : 'versions',
                editorRef: { current: editorContainerComponent ? editorContainerComponent.editor : null },
                collaborators: currentConfig.collaborators || [],
                currentUser: currentConfig.currentUser,
                snapshots: currentConfig.snapshots || [],
                isLoading: currentConfig.snapshotsLoading || false,
                onClose: function () {
                    activePanel = null;
                    sidebar.hide();
                    renderSidebarContent();
                },
                onRestore: currentConfig.onRestoreSnapshot,
                onDelete: currentConfig.onDeleteSnapshot,
                onRename: currentConfig.onRenameSnapshot,
                onClearAll: currentConfig.onClearAllSnapshots
            });
        }

        function update(newConfig) {
            currentConfig = Object.assign(currentConfig, newConfig);

            // Update EditorContainer
            if (editorContainerComponent) {
                var containerUpdate = {};
                if (newConfig.isConnected !== undefined) containerUpdate.isConnected = newConfig.isConnected;
                if (newConfig.collaborators !== undefined) {
                    containerUpdate.collaboratorCount = newConfig.collaborators.length + 1;
                    containerUpdate.users = [currentConfig.currentUser].concat(newConfig.collaborators);
                }
                editorContainerComponent.update(containerUpdate);
            }

            // Update sidebar content if open
            if (sidebarContentComponent && activePanel) {
                var sidebarUpdate = {};
                if (newConfig.collaborators !== undefined) sidebarUpdate.collaborators = newConfig.collaborators;
                if (newConfig.currentUser !== undefined) sidebarUpdate.currentUser = newConfig.currentUser;
                if (newConfig.snapshots !== undefined) sidebarUpdate.snapshots = newConfig.snapshots;
                if (newConfig.snapshotsLoading !== undefined) sidebarUpdate.isLoading = newConfig.snapshotsLoading;
                if (Object.keys(sidebarUpdate).length > 0) {
                    sidebarContentComponent.update(sidebarUpdate);
                }
            }
        }

        return { update: update };
    }

    App.EditorWorkspace = EditorWorkspace;

})(window.App = window.App || {});
