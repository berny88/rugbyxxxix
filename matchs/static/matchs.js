betApp.controller('matchsCtrl', ['$scope', '$http', '$q', '$timeout', '$window', function ($scope, $http, $q, $timeout, $window) {

        var canceler = $q.defer();

        $scope.getMatchs = function() {
            $http.get('matchs/apiv1.0/matchs', {timeout: canceler.promise})
            .then(function(answer) {
                //ng-repeat :
                $scope.matchs = answer.data.matchs;
                $scope.displaySaveButton = false;
                if (isConnected($window)) {
                    $scope.displaySaveButton = true;
                }
            });
            $scope.displayBlogPostSaveButton = false;
            console.log("getMatchs::isConnected($window)="+isConnected($window));
            if (isAdmin($window)) {
                $scope.displayBlogPostSaveButton =true;
            }
        }

        $scope.getMatchsOfTheDay = function() {
            $http.get('matchs/apiv1.0/matchs', {timeout: canceler.promise})
            .then(function(answer) {

                $scope.allMatchs = answer.data.matchs;
                $scope.matchs = [];
                var now = new Date();
                $scope.displayMatchsOfTheDay = false;

                $scope.allMatchs.forEach(function(match) {
                        var matchDate = new Date(match.dateMatch);
                        //var matchDate = Date.parse(match.dateMatch)
                        //var timeDiff = Math.abs(matchDate - now.getTime());
                        //if (Math.ceil(timeDiff / (1000 * 3600 * 24)) == 1) {
                        if (((matchDate.getDate() - now.getDate()) == 0)
                            && ((matchDate.getMonth() - now.getMonth()) == 0)
                            && ((matchDate.getYear() - now.getYear()) == 0)) {
                            $scope.matchs.push(match)
                            $scope.displayMatchsOfTheDay = true;
                        }
                })
            });
        }

        $scope.saveMatchs = function() {
            $('#pleaseWaitDialog').modal('show');
            console.log("getMatchs::$scope.no_save="+$scope.no_save);
            $http.put('matchs/apiv1.0/matchs', {matchs: $scope.matchs, no_save: $scope.no_save, timeout: canceler.promise})
            .then(function(data, status, headers, config) {
                //showAlertSuccess("Paris sauvegardés !");
                $('#pleaseWaitDialog').modal('hide');
                $.notify("Matchs sauvegardés !" , "success");
            },
            function(data, status, headers, config) {
                $('#pleaseWaitDialog').modal('hide');
                if (status==-1) {
                    //do nothing
                } else if (status==403){
                    showAlertError("Même pas en rêve ! status=" + status+ " " + data);
                } else {
                    showAlertError("Erreur lors de la mise à jour des matchs ; erreur HTTP : " + status);
                }
            })
        }

        $scope.createHistoryRankings = function() {
            $('#spin_histo').show();
            $('#pleaseWaitDialog').modal('show');
            $http.put('stats/apiv1.0/stats/historyrankings', {timeout: canceler.promise})
            .then(function(data, status, headers, config) {
                $('#pleaseWaitDialog').modal('hide');
                $.notify("Historique des classements enregistrés !" , "success");
                $('#spin_histo').hide();
            },
            function(data, status, headers, config) {
                $('#pleaseWaitDialog').modal('hide');
                if (status==-1) {
                    //do nothing
                } else if (status==403){
                    showAlertError("Même pas en rêve ! status=" + status+ " " + data);
                } else {
                    showAlertError("Erreur lors de l'enregistrement de l'historique des classements ; erreur HTTP : " + status);
                }
                $('#spin_histo').hide();
            })
        }

        // to avoid the cache of the images (avatars)
        d = new Date();
        $scope.currentDateForAvoidTheCache = d.getTime();

        $scope.getEmails = function() {
            $http.get('/users/apiv1.0/users?validated=true', {timeout: canceler.promise})
            .then(function(answer) {
                $scope.users = answer.data.users;

                tabEmails = [];
                for (var index = 0; index < $scope.users.length; ++index) {
                    user = $scope.users[index];
                    tabEmails.push(user.email);
                }
                $scope.listEmails = tabEmails.join(" ; ");

            });
        }

        $scope.$on('$destroy', function(){
            canceler.resolve();  // Aborts the $http request if it isn't finished.
        });


}]);