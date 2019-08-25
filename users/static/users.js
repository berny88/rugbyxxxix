betApp.controller('UsersListCtrl', ['$scope', '$http', '$q', '$window', function ($scope, $http, $q, $window) {

        var canceler = $q.defer();

        // to avoid the cache of the images (avatars)
        d = new Date();
        $scope.currentDateForAvoidTheCache = d.getTime();

        $scope.getUsers = function() {
            $http.get('/users/apiv1.0/users?validated=true', {timeout: canceler.promise})
            .then(function(answer) {
                //ng-repeat :
                $scope.users = answer.data;
            });
        }

        $scope.canUpdate = function(user_id) {
            var currentUser = {};
            if (isConnected($window)) {
                currentUser = getConnectedUser($window);
            }
            return ((currentUser.user_id == user_id) || isAdmin($window)) ? true : false;
        }

        $scope.$on('$destroy', function(){
            canceler.resolve();  // Aborts the $http request if it isn't finished.
        });

}]);

// Fileupload : the directive to gain access to the file object in our controller
betApp.directive('fileModel', ['$parse', function ($parse) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            var model = $parse(attrs.fileModel);
            var modelSetter = model.assign;

            element.bind('change', function(){
                scope.$apply(function(){
                    modelSetter(scope, element[0].files[0]);
                });
            });
        }
    };
}]);

betApp.controller('UserDetailCtrl', ['$scope', '$http', '$q', '$routeParams', '$location', '$timeout', '$window',
    function ($scope, $http, $q, $routeParams, $location, $timeout, $window) {

    $scope.user = {};

    var canceler = $q.defer();
    $scope.getUserDetail = function() {
        hideAlerts();
        console.log("getUserDetail:user_id", $routeParams.user_id);
        $http.get('/users/apiv1.0/users/'+$routeParams.user_id, {timeout: canceler.promise})
        .then(function(answer) {
            //ng-repeat :
            $scope.user = answer.data.user;
            console.log("getUserDetail:response", answer.data);
            //alert($scope.user.email)
        },function (error){
            console.log(error);
        });
    }

    $scope.hasAuthorization = function() {
        var currentUser = {};
        if (isConnected($window)) {
            currentUser = getConnectedUser($window);
        }
        $scope.firstConnection = $routeParams.firstConnection;
        console.log($scope);
        console.log("$scope.firstConnection=" + $scope.firstConnection);
        if ($scope.user == undefined){
            $scope.user={user_id:"xx"}
        }
        return ((currentUser.user_id == $scope.user.user_id) || $routeParams.firstConnection || isAdmin($window)) ? true : false;
    }

    $scope.$on('$destroy', function(){
        hideAlerts();
        canceler.resolve();  // Aborts the $http request if it isn't finished.
    });
    //called to display le detail of user, when the page is displayed
    $scope.getUserDetail();


    //save the detail of User
    $scope.saveUser = function() {
        //alert(" nickname="+$scope.user.nickName)

        $http.post('/users/apiv1.0/users/'+$routeParams.user_id, {user:$scope.user, timeout: canceler.promise})
        .then(function(answer, status, headers, config) {
            $scope.user = answer.data.user;
            $location.path("#!/users")
            $timeout(function() {
                if ($routeParams.firstConnection) {
                    showAlertSuccess("Welcome " + $scope.user.nickName + " ! Click <a href='#!/signin'>here</a> to log in.");

                } else {
                    //showAlertSuccess("User [" + $scope.user.email + "] sauvegardé avec succès !");
                    $.notify("Parieur [" + $scope.user.nickName + "] sauvegardé avec succès !" , "success");
                }
            }, 1000);

        }, 
        function(data, status, headers, config) {
            if (status==-1) {
                //do nothing
            }else if (status==403){
                showAlertError("Même pas en rêve ! status=" + status+ " " + data);
            }else if (status==401){
                showAlertError("Bad login/password, try again !");
            }else{
                showAlertError("Erreur lors de connexion ; erreur HTTP : " + status + " " + data);
            }
        });

    }

    $scope.getCommunitiesByPlayer = function() {
        $http.get('/communities/apiv1.0/communities?userId='+$routeParams.user_id, {timeout: canceler.promise})
        .then(function(answer) {
            console.log(answer.data);
            console.log(answer.data.communities);
            console.log(answer.data.communities.communities);
            if (answer.data.communities.communities.length!=0){
                $scope.communities = data.communities.communities;
            }else{
                $scope.communities=[];
            }
            $('#spin').hide();
        },
        function(data, status, headers, config) {
            if (status==-1) {
                //do nothing
            } else {
                showAlertError("Erreur lors de la récupération des communautés ; erreur HTTP : " + status);
            }
            $('#spin').hide();
        });
    }

    // to avoid the cache of the images (avatars)
    d = new Date();
    $scope.currentDateForAvoidTheCache = d.getTime();

    $scope.saveAvatar = function() {

        var file = $scope.myAvatar;

        var fd = new FormData();
        fd.append('file', file);
        $http.post('/users/apiv1.0/users/'+$routeParams.user_id + '/avatar', fd, {
            transformRequest: angular.identity,
            headers: {'Content-Type': undefined}
        })
        .then(function(answer) {
            d = new Date();
            $('#img_avatar').attr('src', 'users/apiv1.0/users/'+ $routeParams.user_id +'/avatar?'+d.getTime());
            $.notify("Avatar saved !!" , "success");
        },
        function(answer, status, headers, config) {
            if (status==-1) {
                //do nothing
            } else if (status==403){
                showAlertError("Même pas en rêve ! status=" + status+ " " + answer);
            }else if (status==413){
                showAlertError("Problem with your file : " + answer);
                $.notify("Avatar saving error !!" , "error");
            }else if (status==415){
                showAlertError("Problem with your file  : " + answer);
                $.notify("Avatar saving error !!" , "error");
            }else{
                showAlertError("Avatar saving error ; erreur HTTP : " + status);
            }
        });

    }

}]);

betApp.controller('LoginCtrl', ['$scope', '$http', '$q', '$routeParams', '$location','$timeout', '$window', '$sce', '$rootScope',
    function ($scope, $http, $q, $routeParams, $location, $timeout, $window, $sce, $rootScope) {

        $scope.login = function(){
            connect={email:$scope.email, thepwd:$scope.thepwd};

            $http.post('/users/apiv1.0/login', {connect: connect, timeout: canceler.promise})
            .then(function(answer) {
                hideAlerts();
                setConnectedUserInStorage($window, answer.data.user)
                // Display the user in the topbar :
                $("#connectedUserInTopbar").html(answer.data.user.nickName);
                $rootScope.user_id = answer.data.user.user_id;
                if ($routeParams.callback) {
                    $location.path("/" + $sce.trustAsResourceUrl($routeParams.callback))
                } else {
                    $location.path("/accueil")
                }
                $location.search('callback', null)
                //$timeout(function() {
                //       showAlertSuccess("Bienvenue "+data.user.nickName +" !!");
                //   }, 1000);
                $.notify("Welcome "+answer.data.user.nickName +" !!" , "success");
            },
            function(data, status, headers, config) {
                if (status==-1) {
                    //do nothing
                } else if (status==404){
                    showAlertError("Ben, tu veux allez en vrai ? : status=" + status);
                }else if (status==401){
                    showAlertError("Bad login/password, try again !");
                }else{
                    showAlertError("Erreur lors de connexion ; erreur HTTP : " + status + " " + data);
                }
            });

        }

        $(function () {
            $('#email').focus();
        });

        var canceler = $q.defer();

        $scope.$on('$destroy', function(){
            canceler.resolve();  // Aborts the $http request if it isn't finished.
        });
}]);

betApp.controller('LogoutCtrl', ['$scope', '$http', '$q', '$location','$timeout', '$window',
    function ($scope, $http, $q, $location, $timeout, $window) {

        //alert("logout");
        //to remove the cookie from "session"
        if (isConnected($window)) {
            $scope.logout = function(){
                $http.post('/users/apiv1.0/logout', {})
                .then(function(answer) {
                    hideAlerts();
                    setConnectedUserInStorage($window, null);
                    // Remove the user from the topbar :
                    $("#connectedUserInTopbar").html("Vous n'êtes pas connecté !");
                    $location.path("/")
                    //$timeout(function() {
                    //       showAlertSuccess("Goog bye  !!");
                    //    }, 1000);
                    $.notify("Good bye  !!" , "success");
                },
                function(data, status, headers, config) {
                    if (status==-1) {
                        //do nothing
                    } else {
                        showAlertError("Erreur lors de connexion ; erreur HTTP : " + status + " " + data);
                    }
                });

            }

            $scope.logout();
        }

        var canceler = $q.defer();

        $scope.$on('$destroy', function(){
            canceler.resolve();  // Aborts the $http request if it isn't finished.
        });
}]);
