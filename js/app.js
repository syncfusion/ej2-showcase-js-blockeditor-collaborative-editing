
(function (App) {
    'use strict';
    var Awareness = (function () {
        var collaborators = [];
        var changeListeners = [];
        
        function init(provider, currentUser) {
            if (!provider) return;
            var awareness = provider.awareness;
            
            awareness.setLocalState({
                user: {
                    id: currentUser.id,
                    user: currentUser.user,
                    avatarBgColor: currentUser.avatarBgColor
                }
            });

            function handleChange() {
                var states = awareness.getStates();
                var list = [];
                states.forEach(function (state) {
                    if (state && state.user && state.user.id !== currentUser.id) {
                        list.push(state.user);
                    }
                });
                collaborators = list;
                changeListeners.forEach(function (fn) { fn(collaborators); });
            }

            awareness.on('change', handleChange);
            handleChange();

            return {
                destroy: function () {
                    awareness.off('change', handleChange);
                }
            };
        }

        function onChange(fn) {
            changeListeners.push(fn);
        }

        function getCollaborators() {
            return collaborators;
        }

        return { init: init, onChange: onChange, getCollaborators: getCollaborators };
    })();

    // -----------------------------------------------------------------------
    // Version History Module
    // -----------------------------------------------------------------------
    var VersionHistory = (function () {
        var versionPlugin = null;
        var storage = null;
        var snapshots = [];
        var isLoading = false;
        var changeListeners = [];

        function notifyChange() {
            changeListeners.forEach(function (fn) {
                fn({ snapshots: snapshots, isLoading: isLoading });
            });
        }

        function refreshSnapshots() {
            if (!versionPlugin) return;
            isLoading = true;
            notifyChange();
            try {
                var result = versionPlugin.getSnapshots();
                // getSnapshots() may return a Promise (loads from IndexedDB on first call)
                if (result && typeof result.then === 'function') {
                    result.then(function (data) {
                        snapshots = data || [];
                        isLoading = false;
                        notifyChange();
                    }).catch(function (err) {
                        console.error('Failed to refresh snapshots:', err);
                        isLoading = false;
                        notifyChange();
                    });
                } else {
                    snapshots = result || [];
                    isLoading = false;
                    notifyChange();
                }
            } catch (err) {
                console.error('Failed to refresh snapshots:', err);
                isLoading = false;
                notifyChange();
            }
        }

        function init(plugin, store, onChange) {
            versionPlugin = plugin;
            storage = store;
            if (onChange) changeListeners.push(onChange);
            // Defer initial load slightly to allow the plugin to finish
            // hydrating from IndexedDB storage before querying snapshots.
            setTimeout(function () {
                refreshSnapshots();
            }, 0);
        }

        function restore(snapshotId) {
            if (!versionPlugin) return;
            isLoading = true;
            notifyChange();
            Promise.resolve(versionPlugin.restoreSnapshot(snapshotId)).then(function () {
                refreshSnapshots();
            }).catch(function (err) {
                console.error('Failed to restore snapshot:', err);
                isLoading = false;
                notifyChange();
            });
        }

        function deleteOne(snapshotId) {
            if (!versionPlugin) return;
            isLoading = true;
            notifyChange();
            Promise.resolve(versionPlugin.deleteSnapshot(snapshotId)).then(function () {
                refreshSnapshots();
            }).catch(function (err) {
                console.error('Failed to delete snapshot:', err);
                isLoading = false;
                notifyChange();
            });
        }

        function rename(snapshotId, newLabel) {
            if (!versionPlugin) return;
            isLoading = true;
            notifyChange();
            Promise.resolve(versionPlugin.renameSnapshot(snapshotId, newLabel)).then(function () {
                refreshSnapshots();
            }).catch(function (err) {
                console.error('Failed to rename snapshot:', err);
                isLoading = false;
                notifyChange();
            });
        }

        function clearAll() {
            isLoading = true;
            notifyChange();
            var deleteChain = Promise.resolve();
            snapshots.forEach(function (snapshot) {
                deleteChain = deleteChain.then(function () {
                    if (versionPlugin) {
                        return Promise.resolve(versionPlugin.deleteSnapshot(snapshot.id)).catch(function (err) {
                            console.warn('Failed to delete snapshot ' + snapshot.id + ':', err);
                        });
                    }
                });
            });
            deleteChain.then(function () {
                return storage ? storage.clearAll() : Promise.resolve();
            }).then(function () {
                snapshots = [];
                isLoading = false;
                notifyChange();
            }).catch(function (err) {
                console.error('Failed to clear all snapshots:', err);
                isLoading = false;
                notifyChange();
            });
        }

        return {
            init: init,
            refresh: refreshSnapshots,
            restore: restore,
            deleteOne: deleteOne,
            rename: rename,
            clearAll: clearAll,
            getSnapshots: function () { return snapshots; },
            isLoading: function () { return isLoading; }
        };
    })();

    document.addEventListener('DOMContentLoaded', function () {
        var appEl = document.getElementById('app');
        var headerArea = document.getElementById('header-area');
        var heroArea = document.getElementById('hero-area');
        var loadingArea = document.getElementById('loading-area');
        var workspaceArea = document.getElementById('workspace-area');

        // Render static sections
        App.Header(headerArea);
        App.Hero(heroArea);

        // Show loading spinner
        loadingArea.style.display = '';
        var spinner = App.LoadingSpinner(loadingArea, 'Initializing collaboration...');

        // Get or create room ID
        var roomId = App.RoomId.getOrCreate();

        // Get current user
        var currentUser = App.UserService.getCurrentUser();

        // Create IndexedDB storage
        var storage = new App.IndexedDBVersionStorage('blockeditor-versions-' + roomId);

        // Initialize Collaboration
        var collabHandle = App.Collaboration.init(roomId, function (ydoc, provider, adapter) {
            // Hide loading, show workspace
            spinner.destroy();
            loadingArea.style.display = 'none';
            workspaceArea.style.display = '';

            // Setup awareness
            var awarenessHandle = Awareness.init(provider, currentUser);

            // Setup connection status change listener
            var statusHandle = App.Collaboration.onStatusChange(provider, function (isConnected) {
                if (workspaceComponent) {
                    workspaceComponent.update({ isConnected: isConnected });
                }
            });

            // Build collaboration settings
            var collaborationSettings = {
                provider: provider,
                adapter: {
                    yRuntime: adapter.yRuntime,
                    yXmlFragment: adapter.yXmlFragment
                },
                enableAwareness: true,
                versionHistory: {
                    storage: storage,
                    snapshotInterval: 3000,
                    snapshotCreated: function () {
                        VersionHistory.refresh();
                    },
                    snapshotRestored: function () {
                        VersionHistory.refresh();
                    }
                }
            };

            var defaultBlocks = App.EditorService.getDefaultBlocks();

            var inlineToolbarSettings = {
                items: [
                    'Transform', 'Bold', 'Italic', 'Underline', 'Strikethrough',
                    'Uppercase', 'Lowercase', 'Subscript', 'Superscript',
                    'InlineCode', 'Link', 'Color', 'Backgroundcolor'
                ]
            };

            var imageBlockSettings = {
                saveUrl: 'https://services.syncfusion.com/js/production/api/RichTextEditor/SaveFile',
                path: 'https://services.syncfusion.com/js/production/RichTextEditor/'
            };

            var workspaceComponent = App.EditorWorkspace(workspaceArea, {
                roomId: roomId,
                isConnected: App.Collaboration.getConnectionStatus(provider),
                currentUser: currentUser,
                collaborators: Awareness.getCollaborators(),
                blocks: defaultBlocks,
                users: [currentUser].concat(Awareness.getCollaborators()),
                currentUserId: currentUser.id,
                collaborationSettings: collaborationSettings,
                snapshots: VersionHistory.getSnapshots(),
                snapshotsLoading: VersionHistory.isLoading(),
                inlineToolbarSettings: inlineToolbarSettings,
                imageBlockSettings: imageBlockSettings,
                onRestoreSnapshot: function (snapshotId) {
                    return Promise.resolve(VersionHistory.restore(snapshotId));
                },
                onDeleteSnapshot: function (snapshotId) {
                    return Promise.resolve(VersionHistory.deleteOne(snapshotId));
                },
                onRenameSnapshot: function (snapshotId, newLabel) {
                    return Promise.resolve(VersionHistory.rename(snapshotId, newLabel));
                },
                onClearAllSnapshots: function () {
                    return Promise.resolve(VersionHistory.clearAll());
                },
                onCreated: function (editor) {
                    // Get version history plugin from editor
                    var plugin = null;
                    try {
                        plugin = editor ? editor.getVersionHistory() : null;
                    } catch (e) {
                        console.warn('Could not get version history plugin:', e);
                    }
                    if (!plugin) return;

                    function onVersionChange(state) {
                        if (workspaceComponent) {
                            workspaceComponent.update({
                                snapshots: state.snapshots,
                                snapshotsLoading: state.isLoading
                            });
                        }
                    }

                    // Wait for IndexedDB storage to be ready before initialising,
                    // so that getSnapshots() can hydrate existing data on refresh.
                    var readyPromise = (storage && typeof storage.ready === 'function')
                        ? storage.ready()
                        : Promise.resolve();

                    readyPromise.then(function () {
                        VersionHistory.init(plugin, storage, onVersionChange);
                    }).catch(function (err) {
                        console.warn('Storage ready check failed, initialising anyway:', err);
                        VersionHistory.init(plugin, storage, onVersionChange);
                    });
                }
            });

            // Listen for awareness changes (collaborator list)
            Awareness.onChange(function (collaboratorList) {
                workspaceComponent.update({
                    collaborators: collaboratorList,
                    users: [currentUser].concat(collaboratorList)
                });
            });

            // Handle room ID changes (hashchange)
            window.addEventListener('hashchange', function () {
                var newRoomId = App.RoomId.getFromHash();
                if (newRoomId && newRoomId !== roomId) {
                    window.location.reload();
                }
            });
        });
    });

})(window.App = window.App || {});
