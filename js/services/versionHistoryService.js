(function (App) {
    'use strict';

    /**
     * IndexedDB-based storage for version snapshots.
     * Implements the IVersionStorage interface.
     *
     * @constructor
     * @param {string} dbName - The IndexedDB database name.
     */
    function IndexedDBVersionStorage(dbName) {
        this._dbName = dbName;
        this._storeName = 'snapshots';
        this._db = null;
        this._initPromise = this._initialize();
    }

    /**
     * Initialize the IndexedDB database schema.
     * @returns {Promise<void>}
     */
    IndexedDBVersionStorage.prototype._initialize = function () {
        var self = this;
        return new Promise(function (resolve, reject) {
            var request = indexedDB.open(self._dbName, 1);

            request.onerror = function () {
                reject(new Error('Failed to open IndexedDB: ' + request.error));
            };

            request.onsuccess = function () {
                self._db = request.result;
                resolve();
            };

            request.onupgradeneeded = function (event) {
                var db = event.target.result;
                if (!db.objectStoreNames.contains(self._storeName)) {
                    var store = db.createObjectStore(self._storeName, { keyPath: 'id' });
                    store.createIndex('lastModifiedAt', 'lastModifiedAt', { unique: false });
                }
            };
        });
    };

    /**
     * Persist a snapshot.
     * @param {object} snapshot
     * @returns {Promise<void>}
     */
    IndexedDBVersionStorage.prototype.saveSnapshot = function (snapshot) {
        var self = this;
        return this._initPromise.then(function () {
            if (!self._db) throw new Error('IndexedDB not initialized');
            return new Promise(function (resolve, reject) {
                var tx = self._db.transaction(self._storeName, 'readwrite');
                var store = tx.objectStore(self._storeName);
                var request = store.put(snapshot);
                request.onerror = function () {
                    reject(new Error('Failed to save snapshot: ' + request.error));
                };
                request.onsuccess = function () {
                    resolve();
                };
            });
        });
    };

    /**
     * Load all snapshots ordered by lastModifiedAt.
     * @returns {Promise<Array>}
     */
    IndexedDBVersionStorage.prototype.loadAllSnapshots = function () {
        var self = this;
        return this._initPromise.then(function () {
            if (!self._db) throw new Error('IndexedDB not initialized');
            return new Promise(function (resolve, reject) {
                var tx = self._db.transaction(self._storeName, 'readonly');
                var store = tx.objectStore(self._storeName);
                var index = store.index('lastModifiedAt');
                var request = index.getAll();
                request.onerror = function () {
                    reject(new Error('Failed to load snapshots: ' + request.error));
                };
                request.onsuccess = function () {
                    resolve(request.result || []);
                };
            });
        });
    };

    /**
     * Load a single snapshot by id.
     * @param {string} id
     * @returns {Promise<object|null>}
     */
    IndexedDBVersionStorage.prototype.loadSnapshot = function (id) {
        var self = this;
        return this._initPromise.then(function () {
            if (!self._db) throw new Error('IndexedDB not initialized');
            return new Promise(function (resolve, reject) {
                var tx = self._db.transaction(self._storeName, 'readonly');
                var store = tx.objectStore(self._storeName);
                var request = store.get(id);
                request.onerror = function () {
                    reject(new Error('Failed to load snapshot: ' + request.error));
                };
                request.onsuccess = function () {
                    resolve(request.result || null);
                };
            });
        });
    };

    /**
     * Delete a snapshot by id.
     * @param {string} id
     * @returns {Promise<void>}
     */
    IndexedDBVersionStorage.prototype.deleteSnapshot = function (id) {
        var self = this;
        return this._initPromise.then(function () {
            if (!self._db) throw new Error('IndexedDB not initialized');
            return new Promise(function (resolve, reject) {
                var tx = self._db.transaction(self._storeName, 'readwrite');
                var store = tx.objectStore(self._storeName);
                var request = store.delete(id);
                request.onerror = function () {
                    reject(new Error('Failed to delete snapshot: ' + request.error));
                };
                request.onsuccess = function () {
                    resolve();
                };
            });
        });
    };

    /**
     * Clear all snapshots from storage.
     * @returns {Promise<void>}
     */
    IndexedDBVersionStorage.prototype.clearAll = function () {
        var self = this;
        return this._initPromise.then(function () {
            if (!self._db) throw new Error('IndexedDB not initialized');
            return new Promise(function (resolve, reject) {
                var tx = self._db.transaction(self._storeName, 'readwrite');
                var store = tx.objectStore(self._storeName);
                var request = store.clear();
                request.onerror = function () {
                    reject(new Error('Failed to clear storage: ' + request.error));
                };
                request.onsuccess = function () {
                    resolve();
                };
            });
        });
    };

    /**
     * Wait for initialization to complete.
     * @returns {Promise<void>}
     */
    IndexedDBVersionStorage.prototype.ready = function () {
        return this._initPromise;
    };

    /**
     * Destroy storage and close DB connection.
     */
    IndexedDBVersionStorage.prototype.destroy = function () {
        if (this._db) {
            this._db.close();
            this._db = null;
        }
    };

    App.IndexedDBVersionStorage = IndexedDBVersionStorage;

})(window.App = window.App || {});
