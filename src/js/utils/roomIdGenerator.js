(function (App) {
    'use strict';

    var ROOM_ID_LENGTH = 5;
    var CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    /**
     * Generate a random alphanumeric room ID of the specified length.
     */
    function generateRoomId() {
        var result = '';
        for (var i = 0; i < ROOM_ID_LENGTH; i++) {
            result += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
        }
        return result;
    }

    /**
     * Get the current room ID from the URL hash.
     * Returns null if the hash is empty or not present.
     */
    function getRoomIdFromHash() {
        var hash = window.location.hash;
        if (hash && hash.length > 1) {
            return hash.slice(1);
        }
        return null;
    }

    /**
     * Set the room ID in the URL hash without reloading the page.
     */
    function setRoomIdInHash(roomId) {
        window.location.hash = roomId;
    }

    /**
     * Get the existing room ID from the hash, or create and persist a new one.
     */
    function getOrCreateRoomId() {
        var roomId = getRoomIdFromHash();
        if (!roomId) {
            roomId = generateRoomId();
            setRoomIdInHash(roomId);
        }
        return roomId;
    }

    App.RoomId = {
        generate: generateRoomId,
        getFromHash: getRoomIdFromHash,
        setInHash: setRoomIdInHash,
        getOrCreate: getOrCreateRoomId
    };

})(window.App = window.App || {});
