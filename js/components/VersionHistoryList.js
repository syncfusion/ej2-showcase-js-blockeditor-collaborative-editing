(function (App) {
    'use strict';

    /**
     * Get a date group label for a timestamp.
     */
    function getDateGroup(timestamp) {
        var date = new Date(timestamp);
        var today = new Date();
        var yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        var dateString = date.toDateString();
        var todayString = today.toDateString();
        var yesterdayString = yesterday.toDateString();

        if (dateString === todayString) return 'Today';
        if (dateString === yesterdayString) return 'Yesterday';

        var diffTime = today.getTime() - date.getTime();
        var diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays < 7) return 'This Week';
        if (diffDays < 30) return 'This Month';

        return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
    }

    /**
     * Format a timestamp to readable string.
     */
    function formatTimestamp(timestamp) {
        return new Date(timestamp).toLocaleString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Render the version history list.
     *
     * @param {HTMLElement} container
     * @param {object} config - { snapshots, isLoading, onRestore, onDelete, onRename, editorRef }
     * @returns {{ update: function(snapshots, isLoading) }}
     */
    function VersionHistoryList(container, config) {
        var listView = null;
        var renameModal = App.LabelRenameModal('Rename Snapshot');
        var currentSnapshots = config.snapshots || [];
        var editorRef = config.editorRef || { current: null };

        var listHost = document.createElement('div');
        listHost.id = 'version-history-list';
        container.appendChild(listHost);

        function getUserName(userId) {
            var editor = editorRef.current;
            if (!editor || !editor.users) return 'Unknown';
            var found = null;
            for (var i = 0; i < editor.users.length; i++) {
                if (editor.users[i].id === userId) {
                    found = editor.users[i];
                    break;
                }
            }
            return found ? (found.user || 'Unknown') : 'Unknown';
        }

        function mapSnapshots(snapshots) {
            return (snapshots || []).map(function (snapshot) {
                return {
                    id: snapshot.id,
                    headerText: snapshot.label || formatTimestamp(snapshot.lastModifiedAt),
                    label: snapshot.label || '',
                    isAutoLabel: !snapshot.label,
                    timestamp: formatTimestamp(snapshot.lastModifiedAt),
                    userName: getUserName(snapshot.lastModifiedBy),
                    lastModifiedBy: snapshot.lastModifiedBy,
                    lastModifiedAt: snapshot.lastModifiedAt,
                    dateGroup: getDateGroup(snapshot.lastModifiedAt)
                };
            });
        }

        function handleMenuAction(snapshotId, action) {
            if (action === 'restore') {
                config.onRestore(snapshotId);
            } else if (action === 'rename') {
                var snapshot = null;
                for (var i = 0; i < currentSnapshots.length; i++) {
                    if (currentSnapshots[i].id === snapshotId) {
                        snapshot = currentSnapshots[i];
                        break;
                    }
                }
                var initialLabel = snapshot ? (snapshot.label || '') : '';
                renameModal.show(snapshotId, initialLabel, function (id, newLabel) {
                    config.onRename(id, newLabel);
                });
            } else if (action === 'delete') {
                if (window.confirm('Are you sure you want to delete this version? This action cannot be undone.')) {
                    config.onDelete(snapshotId);
                }
            }
        }

        var menuItems = [
            { text: 'Restore', id: 'restore', iconCss: 'e-icons e-redo' },
            { text: 'Rename', id: 'rename', iconCss: 'e-icons e-edit' },
            { separator: true },
            { text: 'Delete', id: 'delete', iconCss: 'e-icons e-trash', cssClass: 'e-danger' }
        ];

        function itemTemplate(data) {
            return '<div class="e-list-wrapper version-item-wrapper">' +
                '<div class="version-content">' +
                '<div class="version-label">' +
                '<h4 class="version-title">' + (data.headerText || '') + '</h4>' +
                (data.isAutoLabel ? '<span class="auto-badge">[auto]</span>' : '') +
                '</div>' +
                '<p class="version-meta">' +
                (data.userName || '') +
                (data.label ? ' &middot; ' + data.timestamp : '') +
                '</p>' +
                '</div>' +
                '<div class="version-actions" id="vha-' + data.id + '"></div>' +
                '</div>';
        }

        function groupTemplate(data) {
            return '<div class="e-list-group-header"><span class="group-title">' + (data.headerText || '') + '</span></div>';
        }

        function renderDropDownButtons() {
            var actionDivs = listHost.querySelectorAll('[id^="vha-"]');
            for (var i = 0; i < actionDivs.length; i++) {
                var div = actionDivs[i];
                var snapshotId = div.id.replace('vha-', '');
                if (div.children.length > 0) continue; // already rendered
                (function (sid) {
                    var btnHost = document.createElement('button');
                    div.appendChild(btnHost);
                    var ddb = new ej.splitbuttons.DropDownButton({
                        items: menuItems,
                        cssClass: 'e-caret-hide e-small e-flat',
                        iconCss: 'e-icons e-more-vertical-2',
                        select: function (args) {
                            handleMenuAction(sid, args.item.id);
                        }
                    });
                    ddb.appendTo(btnHost);
                })(snapshotId);
            }
        }

        function renderEmpty() {
            listHost.innerHTML = '<div class="e-listview-empty"><p class="empty-message">No versions yet. Create a snapshot to save your work.</p></div>';
        }

        function renderLoading() {
            listHost.innerHTML = '<div class="e-listview-loader"><div class="spinner-host-versions"></div></div>';
            var spinnerEl = listHost.querySelector('.spinner-host-versions');
            if (spinnerEl) {
                ej.popups.createSpinner({ target: spinnerEl });
                ej.popups.showSpinner(spinnerEl);
            }
        }

        function update(snapshots, isLoading) {
            currentSnapshots = snapshots || [];

            if (isLoading) {
                if (listView) {
                    listView.destroy();
                    listView = null;
                }
                renderLoading();
                return;
            }

            var data = mapSnapshots(currentSnapshots);

            if (data.length === 0) {
                if (listView) {
                    listView.destroy();
                    listView = null;
                }
                renderEmpty();
                return;
            }

            if (!listView) {
                listHost.innerHTML = '';
                var innerHost = document.createElement('div');
                listHost.appendChild(innerHost);
                listView = new ej.lists.ListView({
                    dataSource: data,
                    fields: { id: 'id', text: 'headerText', groupBy: 'dateGroup' },
                    template: itemTemplate,
                    groupTemplate: groupTemplate,
                    showHeader: false,
                    cssClass: 'e-list-template'
                });
                listView.appendTo(innerHost);
                listView.element.id = 'version-history-list';
            } else {
                listView.dataSource = data;
                listView.dataBind();
            }
            setTimeout(renderDropDownButtons, 0);
        }

        // Initial render
        update(config.snapshots, config.isLoading);

        return { update: update };
    }

    App.VersionHistoryList = VersionHistoryList;

})(window.App = window.App || {});
