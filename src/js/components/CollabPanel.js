(function (App) {
    'use strict';

    /**
     * Get initials from a name string.
     * @param {string} name
     * @returns {string}
     */
    function getInitials(name) {
        if (!name) return '';
        return name.split(' ')
            .map(function (n) { return n[0]; })
            .join('')
            .toUpperCase()
            .slice(0, 2);
    }

    /**
     * Render the active collaborators panel.
     *
     * @param {HTMLElement} container
     * @param {object} config - { collaborators: UserModel[], currentUser: UserModel }
     * @returns {{ update: function(collaborators, currentUser) }}
     */
    function CollabPanel(container, config) {
        var listView = null;

        var wrapper = document.createElement('div');
        wrapper.className = 'collab-panel';

        var listWrapper = document.createElement('div');
        listWrapper.className = 'collaborators-list';

        var listHost = document.createElement('div');
        listHost.id = 'collab-list';
        listWrapper.appendChild(listHost);
        wrapper.appendChild(listWrapper);
        container.appendChild(wrapper);

        function buildDataSource(collaborators, currentUser) {
            var allUsers = [currentUser].concat(collaborators || []);
            return allUsers.map(function (user) {
                return {
                    id: user.id,
                    headerText: user.id === currentUser.id ? (user.user + ' (You)') : user.user,
                    contentText: 'Active',
                    avatarText: getInitials(user.user),
                    avatarColor: user.avatarBgColor
                };
            });
        }

        function itemTemplate(data) {
            return '<div class="e-list-wrapper collaborator-item">' +
                '<span class="e-avatar e-avatar-circle e-avatar-small" style="background-color:' + (data.avatarColor || '#185fa5') + ';color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:500;">' +
                data.avatarText +
                '</span>' +
                '<div class="collaborator-info">' +
                '<span class="e-list-item-header">' + data.headerText + '</span>' +
                '</div>' +
                '</div>';
        }

        var initialData = buildDataSource(config.collaborators, config.currentUser);

        listView = new ej.lists.ListView({
            id: 'collab-list',
            dataSource: initialData,
            fields: { id: 'id', text: 'headerText' },
            template: itemTemplate,
            showHeader: false,
            cssClass: 'e-list-template'
        });
        listView.appendTo(listHost);

        function update(collaborators, currentUser) {
            var data = buildDataSource(collaborators, currentUser);
            listView.dataSource = data;
            listView.dataBind();
        }

        return { update: update };
    }

    App.CollabPanel = CollabPanel;

})(window.App = window.App || {});
