betApp.directive('customPopover', function ($http,$timeout) {
    return {
        restrict: 'A',
        link: function (scope, el, attrs) {

            el.bind('click', function(e) {

                    $http.get('bets/apiv1.0/bets/'+attrs.popoverKey+'/rates')
                    .then(function(answer, status, headers, config) {

                        $(el).popover({
                            trigger: 'focus',
                            html:true,
                            title: 'Trends',
                            content: '<table><tr><td>Number of players</td><td>: '+answer.data.rates.nbBets +'</td></tr><tr><td>TeamA winner</td><td>: '+data.rates.winnerAPercent+'%</td></tr>'+'<tr><td>Draw</td><td>: '+data.rates.drawPercent+'%</td></tr>'+'<tr><td>TeamB winner</td><td>: '+data.rates.winnerBPercent+'%</td></tr></table>',
                            placement: attrs.popoverPlacement});
                        $(el).popover('show');

                    },
                    function(data, status, headers, config) {
                        if (status==-1) {
                            //do nothing
                        }else {
                            showAlertError("Erreur lors de la récupération des statistiques ; erreur HTTP : " + status);
                        }
                    });
            })
        }
    };
});

betApp.controller('BetsCtrl', ['$scope', '$routeParams', '$http', '$q', '$location', '$timeout', '$window',
                            function ($scope, $routeParams, $http, $q, $location, $timeout, $window) {

        var canceler = $q.defer();

        $('#pleaseWaitDialog').modal('hide');

        // to split the table of bets :
        $scope.onlyGroupeFilter = function (bet) {
            return bet.category === 'GROUPE';
        };
        $scope.onlyFinalFilter = function (bet) {
            return bet.category === 'FINAL';
        };

        // Jauge :
        var config = liquidFillGaugeDefaultSettings();
        config.circleThickness = 0.1;
        config.circleFillGap = 0.1;
        config.textVertPosition = 0.8;
        config.waveAnimateTime = 1000;
        config.waveHeight = 0.1;
        config.waveCount = 3;
        var gauge= loadLiquidFillGauge("fillgauge", 0, config);

        $scope.getBetsByCommunityId = function() {

            $scope.bets = {};

            hideAlerts();

            $('#spin_bets_groupe').show();
            $('#spin_bets_final').show();

            if (isConnected($window)) {
                //$http.get('communities/apiv1.0/communities/'+ com_id + '/users/'+ getConnectedUser($window).user_id +'/bets ', {timeout: canceler.promise})
                $http.get('communities/apiv1.0/communities/'+ $routeParams.com_id + '/users/'+ getConnectedUser($window).user_id +'/bets ', {timeout: canceler.promise})
                .then(function(answer, status, headers, config) {
                    $scope.bets = answer.data;

                    // to disable the input fields in the form
                    $scope.displaySaveButton = false;
                    $scope.bets.bets.forEach(function(bet) {
                        if (Date.parse(bet.dateDeadLineBet) > new Date()) {
                            bet.notClosed = true;
                            $scope.displaySaveButton = true;
                        } else {
                            bet.notClosed = false;
                        }
                    });

                    $('#spin_bets_groupe').hide();
                    $('#spin_bets_final').hide();

                    $scope.gaugeUpdate($scope.bets.bets)

                },
                function(data, status, headers, config) {
                    if (status==-1) {
                        //do nothing
                    }else {
                        showAlertError("Erreur lors de la récupération de la liste des paris ; erreur HTTP : " + status);
                    }
                    $('#spin_bets_groupe').hide();
                    $('#spin_bets_final').hide();
                    gauge.update(0);
                });
            }

        }

        $scope.gaugeUpdate = function(bets) {
            $scope.nbBetsTot = 0;
            $scope.nbBetsUser = 0;
            bets.forEach(function(bet) {
                if ((bet.resultA != null) && (bet.resultB != null)) {
                    $scope.nbBetsUser = $scope.nbBetsUser + 1;
                }
                $scope.nbBetsTot = $scope.nbBetsTot +1;
            });

            $scope.gauge = Math.ceil($scope.nbBetsUser * 100 / $scope.nbBetsTot);
            gauge.update($scope.gauge);
        }

        $scope.saveBets = function() {

            $('#pleaseWaitDialog').modal('show');

            $http.put('communities/apiv1.0/communities/'+ $routeParams.com_id + '/users/'+ getConnectedUser($window).user_id +'/bets ', {bets: $scope.bets.bets, timeout: canceler.promise})
            .then(function(answer, status, headers, config) {
                //showAlertSuccess("Paris sauvegardés !");
                $.notify("Bets saved !" , "success");
                $('#pleaseWaitDialog').modal('hide');
            },
            function(data, status, headers, config) {
                if (status==-1) {
                    //do nothing
                } else if (status==403){
                    showAlertError("Même pas en rêve ! status=" + status+ " " + data);
                } else {
                    showAlertError("Erreur lors de la création des paris ; erreur HTTP : " + status);
                }
                $('#pleaseWaitDialog').modal('hide');
            })
        }

        // Aborts the $http request if it isn't finished.
        $scope.$on('$destroy', function(){
            hideAlerts();
            canceler.resolve();
        });

}]);