/**
Security stuff

Provide function to manage the security :
- isConnected() : true/false
- getConnectedUser() : the current user who has sign in or null if not connected
- isAdmin() : true/false

Waring : you have to inject "$window" to you controller who uses these methods !!!

**/

function setConnectedUserInStorage($window, currentUser) {
    $window.sessionStorage["currentUser"] = JSON.stringify(currentUser);
}

function isConnected($window) {
    if (!$window.sessionStorage["currentUser"]) {
        return false;
    }
    if (typeof $window.sessionStorage["currentUser"] == 'undefined') {
        return false;
    }
    if ($window.sessionStorage["currentUser"] == "null") {
        return false;
    }
    return true
}

function getConnectedUser($window) {
    if (isConnected($window)) {
        return JSON.parse($window.sessionStorage["currentUser"]);
    } else {
        return null;
    }
}

function isAdmin($window) {
    if (isConnected($window)) {
        return getConnectedUser($window).isAdmin;
    } else {
        return false;
    }
}