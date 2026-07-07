(function (App) {
    'use strict';

    /**
     * Get default editor blocks (deep clone).
     */
    function getDefaultBlocks() {
        return JSON.parse(JSON.stringify(App.MockData.DEFAULT_EDITOR_BLOCKS));
    }

    /**
     * Get Blockeditor collaboration settings object.
     */
    function getCollaborationSettings(provider, adapter) {
        return {
            provider: provider,
            adapter: adapter,
            enableAwareness: true,
            snapshotInterval: 3000
        };
    }

    /**
     * Get base BlockEditor configuration.
     */
    function getBlockEditorConfig() {
        return {
            blocks: getDefaultBlocks(),
            toolbar: {
                items: ['undo', 'redo', 'formatTools', 'insertTools']
            }
        };
    }

    App.EditorService = {
        getDefaultBlocks: getDefaultBlocks,
        getCollaborationSettings: getCollaborationSettings,
        getBlockEditorConfig: getBlockEditorConfig
    };

})(window.App = window.App || {});
