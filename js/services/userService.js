(function (App) {
    'use strict';

    var USER_STORAGE_KEY = 'blockeditor-current-user';
    var currentUser = null;

    /**
     * Load user from sessionStorage.
     */
    function loadUserFromStorage() {
        try {
            var storedData = sessionStorage.getItem(USER_STORAGE_KEY);
            if (storedData) {
                return JSON.parse(storedData);
            }
        } catch (error) {
            console.error('Failed to load user from storage:', error);
        }
        return null;
    }

    /**
     * Save user to sessionStorage.
     */
    function saveUserToStorage(user) {
        try {
            sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
        } catch (error) {
            console.error('Failed to save user to storage:', error);
        }
    }

    /**
     * Get current active user.
     * - Retrieves from sessionStorage if available
     * - Generates new user if not found
     */
    function getCurrentUser() {
        if (!currentUser) {
            var storedUser = loadUserFromStorage();
            if (storedUser) {
                currentUser = storedUser;
            } else {
                currentUser = App.MockData.generateUser();
                saveUserToStorage(currentUser);
            }
        }
        return currentUser;
    }

    /**
     * Set current active user.
     */
    function setCurrentUser(user) {
        currentUser = user;
        saveUserToStorage(user);
    }

    App.UserService = {
        getCurrentUser: getCurrentUser,
        setCurrentUser: setCurrentUser
    };

})(window.App = window.App || {});
