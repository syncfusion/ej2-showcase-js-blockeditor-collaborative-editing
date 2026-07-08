(function (App) {
    'use strict';

    /**
     * Render the unified sidebar content (collaborators or versions panel).
     *
     * @param {HTMLElement} container
     * @param {object} config - {
     *   mode: 'collaborators'|'versions',
     *   editorRef: { current: BlockEditor },
     *   collaborators: UserModel[],
     *   currentUser: UserModel,
     *   snapshots: VersionSnapshot[],
     *   isLoading: boolean,
     *   onClose: function,
     *   onRestore: function,
     *   onDelete: function,
     *   onRename: function,
     *   onClearAll: function
     * }
     * @returns {{ update: function(newConfig), destroy: function }}
     */
    function SidebarContent(container, config) {
        var currentConfig = Object.assign({}, config);
        var isClearing = false;
        var contentComponent = null;

        // Wrapper
        var wrapper = document.createElement('div');
        wrapper.className = 'sidebar-content-wrapper';

        // Header
        var header = document.createElement('div');
        header.className = 'sidebar-header';

        var titleEl = document.createElement('h3');
        titleEl.className = 'sidebar-title';

        var headerActions = document.createElement('div');
        headerActions.className = 'sidebar-header-actions';

        header.appendChild(titleEl);
        header.appendChild(headerActions);

        // Content area
        var contentArea = document.createElement('div');
        contentArea.className = 'sidebar-content';

        wrapper.appendChild(header);
        wrapper.appendChild(contentArea);
        container.appendChild(wrapper);

        // Delete All button (only for versions mode with snapshots)
        var deleteAllBtnHost = document.createElement('button');
        headerActions.appendChild(deleteAllBtnHost);
        var deleteAllBtn = new ej.buttons.Button({ cssClass: 'e-small', content: 'Delete All' });
        deleteAllBtn.appendTo(deleteAllBtnHost);
        deleteAllBtnHost.title = 'Delete all snapshots';
        deleteAllBtnHost.style.display = 'none';
        deleteAllBtnHost.addEventListener('click', function () {
            if (isClearing || currentConfig.isLoading) return;
            if (!currentConfig.snapshots || currentConfig.snapshots.length === 0) return;
            var confirmed = window.confirm(
                'Are you sure you want to delete all ' + currentConfig.snapshots.length + ' snapshot(s)? This action cannot be undone.'
            );
            if (confirmed) {
                isClearing = true;
                deleteAllBtnHost.disabled = true;
                Promise.resolve(currentConfig.onClearAll()).then(function () {
                    isClearing = false;
                    deleteAllBtnHost.disabled = false;
                }).catch(function (err) {
                    console.error('Failed to clear all snapshots:', err);
                    isClearing = false;
                    deleteAllBtnHost.disabled = false;
                });
            }
        });

        // Close button
        var closeBtnHost = document.createElement('button');
        headerActions.appendChild(closeBtnHost);
        var closeBtn = new ej.buttons.Button({ cssClass: 'e-small' });
        closeBtn.appendTo(closeBtnHost);
        closeBtnHost.textContent = '×';
        closeBtnHost.title = 'Close';
        closeBtnHost.addEventListener('click', function () {
            if (currentConfig.onClose) currentConfig.onClose();
        });

        function renderContent() {
            // Clean up previous component
            if (contentComponent && contentComponent.destroy) {
                contentComponent.destroy();
            }
            contentArea.innerHTML = '';
            contentComponent = null;

            if (currentConfig.mode === 'collaborators') {
                titleEl.textContent = 'Active Collaborators';
                deleteAllBtnHost.style.display = 'none';
                contentComponent = App.CollabPanel(contentArea, {
                    collaborators: currentConfig.collaborators,
                    currentUser: currentConfig.currentUser
                });
            } else {
                titleEl.textContent = 'Version History';
                var hasSnapshots = currentConfig.snapshots && currentConfig.snapshots.length > 0;
                deleteAllBtnHost.style.display = hasSnapshots ? '' : 'none';
                deleteAllBtnHost.disabled = isClearing || currentConfig.isLoading;
                contentComponent = App.VersionHistoryList(contentArea, {
                    editorRef: currentConfig.editorRef,
                    snapshots: currentConfig.snapshots,
                    isLoading: currentConfig.isLoading,
                    onRestore: currentConfig.onRestore,
                    onDelete: currentConfig.onDelete,
                    onRename: currentConfig.onRename
                });
            }
        }

        renderContent();

        function update(newConfig) {
            var prevMode = currentConfig.mode;
            currentConfig = Object.assign(currentConfig, newConfig);

            if (newConfig.mode && newConfig.mode !== prevMode) {
                // Mode changed: full re-render
                renderContent();
            } else if (currentConfig.mode === 'collaborators' && contentComponent && contentComponent.update) {
                contentComponent.update(currentConfig.collaborators, currentConfig.currentUser);
            } else if (currentConfig.mode === 'versions' && contentComponent && contentComponent.update) {
                var hasSnapshots = currentConfig.snapshots && currentConfig.snapshots.length > 0;
                deleteAllBtnHost.style.display = hasSnapshots ? '' : 'none';
                deleteAllBtnHost.disabled = isClearing || currentConfig.isLoading;
                contentComponent.update(currentConfig.snapshots, currentConfig.isLoading);
            }
        }

        function destroy() {
            if (contentComponent && contentComponent.destroy) {
                contentComponent.destroy();
            }
            if (container.contains(wrapper)) {
                container.removeChild(wrapper);
            }
        }

        return { update: update, destroy: destroy };
    }

    App.SidebarContent = SidebarContent;

})(window.App = window.App || {});
