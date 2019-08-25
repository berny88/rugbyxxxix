betApp.controller('statsMatchsCtrl', ['$scope', '$http', '$q', '$timeout', '$window', function ($scope, $http, $q, $timeout, $window) {

    console.log("buble_1 ******");

    var diameter = 960,
        format = d3.format(",d"),
        color = d3.scale.category20c();

    var bubble = d3.layout.pack()
        .sort(null)
        .size([diameter, diameter])
        .padding(1.5);

    console.log("select('buble_1')"+d3.select("buble_1"));
    var svg = d3.select("buble_1").append("svg")
        .attr("width", diameter)
        .attr("height", diameter)
        .attr("class", "bubble");

        d3.json("/stats/apiv1.0/stats/teams", function(error, root) {
          if (error) throw error;

          var node = svg.selectAll(".node")
              .data(bubble.nodes(classes(root))
              .filter(function(d) { return !d.children; }))
            .enter().append("g")
              .attr("class", "node")
              .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

          node.append("title")
              .text(function(d) { return d.className + ": " + format(d.value); });

          node.append("circle")
              .attr("r", function(d) { return d.r; })
              .style("fill", function(d) { console.log("d.packageName="+d.packageName+" color="+d.packageColor); return d.packageColor; });

          node.append("text")
              .attr("dy", ".3em")
              .style("text-anchor", "middle")
              .text(function(d) { return d.className.substring(0, d.r / 3); });
        });

        // Returns a flattened hierarchy containing all leaf nodes under the root.
        function classes(root) {
          console.log("root="+root.teams);
          var classes = [];

          function recurse(name, color, node) {
            if (node.children) {
                node.children.forEach(function(child) { recurse(node.name, node.color, child); });
            } else {
                console.log("name="+name+" node.name="+ node.name+" color="+color);
                //nb_goal+1 to be sure to have a buble
                classes.push({packageName: name, packageColor: color, className: node.name, value: node.nb_goal});
            }
          }

          recurse(null, null, root.teams);
          return {children: classes};
        }

        d3.select(self.frameElement).style("height", diameter + "px");


}]);

betApp.controller('statsHuitMatchsCtrl', ['$scope', '$http', '$q', '$timeout', '$window', function ($scope, $http, $q, $timeout, $window) {

    console.log("buble_2 ******");

    var diameter = 960,
        format = d3.format(",d"),
        color = d3.scale.category20c();

    var bubble = d3.layout.pack()
        .sort(null)
        .size([diameter, diameter])
        .padding(1.5);

    console.log("select('buble_2')"+d3.select("buble_2"));
    var svg = d3.select("buble_2").append("svg")
        .attr("width", diameter)
        .attr("height", diameter)
        .attr("class", "bubble");

        d3.json("/stats/apiv1.0/stats/teams_huit", function(error, root) {
          if (error) throw error;

          var node = svg.selectAll(".node")
              .data(bubble.nodes(classes(root))
              .filter(function(d) { return !d.children; }))
            .enter().append("g")
              .attr("class", "node")
              .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

          node.append("title")
              .text(function(d) { return d.className + ": " + format(d.value); });

          node.append("circle")
              .attr("r", function(d) { return d.r; })
              .style("fill", function(d) { console.log("d.packageName="+d.packageName+" color="+d.packageColor); return d.packageColor; });

          node.append("text")
              .attr("dy", ".3em")
              .style("text-anchor", "middle")
              .text(function(d) { return d.className.substring(0, d.r / 3); });
        });

        // Returns a flattened hierarchy containing all leaf nodes under the root.
        function classes(root) {
          console.log("root="+root.teams);
          var classes = [];

          function recurse(name, color, node) {
            if (node.children) {
                node.children.forEach(function(child) { recurse(node.name, node.color, child); });
            } else {
                console.log("name="+name+" node.name="+ node.name+" color="+color);
                //nb_goal+1 to be sure to have a buble
                classes.push({packageName: name, packageColor: color, className: node.name, value: node.nb_goal});
            }
          }

          recurse(null, null, root.teams);
          return {children: classes};
        }

        d3.select(self.frameElement).style("height", diameter + "px");


}]);


betApp.controller('statsRankingCtrl', ['$scope', '$http', '$q', '$routeParams','$filter', function ($scope, $http, $q, $routeParams,$filter) {

    var canceler = $q.defer();

    // to avoid the cache of the images (avatars)
    d = new Date();
    $scope.currentDateForAvoidTheCache = d.getTime();

    $scope.getRanking = function(category) {
        $('#spin').show();
        $('#spinRanking').show();
        $('#divRanking').hide();

        if (category == 'GROUPE') {
            $('#btn-groupe').addClass('active');
            $('#btn-final').removeClass('active');
            $('#btn-all').removeClass('active');
        } else if (category == 'FINAL') {
            $('#btn-groupe').removeClass('active');
            $('#btn-final').addClass('active');
            $('#btn-all').removeClass('active');
        } else {
            $('#btn-groupe').removeClass('active');
            $('#btn-final').removeClass('active');
            $('#btn-all').addClass('active');
        }

        $http.get('/stats/apiv1.0/stats/ranking?filter='+category, {timeout: canceler.promise})
        .then(function(answer) {
            $scope.rankings = answer.data;
            $('#spin').hide();
            $('#spinRanking').hide();
            $('#divRanking').show();
        },
        function(data, status, headers, config) {
            if (status==-1) {
                //do nothing
            } else {
                showAlertError("Erreur lors de la récupération du classement général ; erreur HTTP : " + status);
            }
            $('#spin').hide();
            $('#spinRanking').hide();
        });
    }

    $scope.getHistoryRanking = function() {

        var community_id = $routeParams.com_id;
        if (!$routeParams.com_id) {
            community_id = 'all'
        }
        $http.get('/stats/apiv1.0/stats/historyrankings?com_id='+community_id, {timeout: canceler.promise})
        .then(function(answer) {
            $scope.historyrankings = answer.data.data.historyrankings;
            dates = [];
            users_id =[];
            users_nickname =[];
            var mapHistoryRankings = {};
            for (var index = 0; index < $scope.historyrankings.length; ++index) {
                ranking = $scope.historyrankings[index];
                dates.push(ranking.date_ranking);
                users_id.push(ranking.user_id);
                users_nickname.push(ranking.user_nickname)
                mapHistoryRankings[ranking.date_ranking+'__'+ranking.user_id] = ranking;
            }

            // Prepare datas for the chart (unique values)
            var uniqueDates = [];
            $.each(dates, function(i, el){
                if($.inArray(el, uniqueDates) === -1) uniqueDates.push(el);
            });
            var uniqueUsers_id = [];
            $.each(users_id, function(i, el){
                if($.inArray(el, uniqueUsers_id) === -1) uniqueUsers_id.push(el);
            });
            var uniqueUsers_nickname = [];
            $.each(users_nickname, function(i, el){
                if($.inArray(el, uniqueUsers_nickname) === -1) uniqueUsers_nickname.push(el);
            });
            var series = [];
            for (var indexA = 0; indexA < uniqueUsers_id.length; ++indexA) {
                user_id = uniqueUsers_id[indexA];
                var serie = [];
                for (var indexB = 0; indexB < uniqueDates.length; ++indexB) {
                    date = uniqueDates[indexB];
                    key = date+'__'+user_id;
                    if (key in mapHistoryRankings) {
                        serie.push({meta:  mapHistoryRankings[key].user_nickname, value: mapHistoryRankings[key].nb_points});
                    } else {
                        serie.push(null);
                    }
                }
                series.push(serie);
            }

            // Display dates in a short format :
            var uniqueDates_shortFormat = [];
            for (var index = 0; index < uniqueDates.length; ++index) {
                dateFromDB = uniqueDates[index];
                uniqueDates_shortFormat.push($filter('date')(dateFromDB, "dd/MM"));
            }

            var data = {
              // A labels array that can contain any sort of values
              labels: uniqueDates_shortFormat,
              // Our series array
              series: series
            };

            var options = {
              lineSmooth: Chartist.Interpolation.cardinal({
                fillHoles: true,
               }),
               plugins: [
                    Chartist.plugins.legend({legendNames: uniqueUsers_nickname}),

                    Chartist.plugins.ctAxisTitle({
                          axisX: {
                            axisTitle: 'Dates',
                            axisClass: 'ct-axis-title',
                            offset: {
                              x: 0,
                              y: 35
                            },
                            textAnchor: 'middle'
                          },
                          axisY: {
                            axisTitle: 'Points',
                            axisClass: 'ct-axis-title',
                            offset: {
                              x: 0,
                              y: -5
                            },
                            textAnchor: 'middle',
                            flipTitle: false
                          }
                        }),

                    Chartist.plugins.tooltip()

                    ]
            }

            var responsiveOptions = [
              ['screen and (max-width: 640px)', {
                axisX: {
                  labelInterpolationFnc: function(value, index) {
                    if (uniqueDates.length > 4) {
                        return index % 10 === 0 ? value : null;
                    } else {
                        return value;
                    }
                  }
                }
              }],
              ['screen and (min-width: 640px)', {
                axisX: {
                  labelInterpolationFnc: function(value, index) {
                    if (uniqueDates.length > 15) {
                        return index % 3 === 0 ? value : null;
                    } else {
                        return value;
                    }
                  }
                }
              }]
            ];

            // Create a new line chart object where as first parameter we pass in a selector
            // that is resolving to our chart container element. The Second parameter
            // is the actual data object.

            if (uniqueDates_shortFormat.length > 0) {
                new Chartist.Line('.ct-chart', data, options, responsiveOptions);
            }
            $('#spin').hide();
            $('#spin3').hide();

        },
        function(data, status, headers, config) {
            if (status==-1) {
                //do nothing
            } else {
                showAlertError("Erreur lors de la récupération de l'historique des classements ; erreur HTTP : " + status);
            }
            $('#spin').hide();
            $('#spin3').hide();
        });

    }

    $scope.getCommunitiesRanking = function (category) {

        $('#spin_communities_ranking').show();
        $('#plotly_pie').hide();

        if (category == 'GROUPE') {
            $('#btn-groupe').addClass('active');
            $('#btn-final').removeClass('active');
            $('#btn-all').removeClass('active');
        } else if (category == 'FINAL') {
            $('#btn-groupe').removeClass('active');
            $('#btn-final').addClass('active');
            $('#btn-all').removeClass('active');
        } else {
            $('#btn-groupe').removeClass('active');
            $('#btn-final').removeClass('active');
            $('#btn-all').addClass('active');
        }

        $http.get('communities/apiv1.0/communities', {timeout: canceler.promise})
        .then(function(answer, status, headers, config) {
            $scope.communities = answer.data.communities;

            var tasks = fillValuesAndLabels($scope.communities,category);

            // wait the alls 'tasks' are done :
            $.when.apply($, tasks).done(function() {

                var data = [{
                  values: $scope.values,
                  labels: $scope.labels,
                  domain: {
                    x: [0, 1]
                  },
                  hoverinfo: 'label+percent+value',
                  hole: .4,
                  type: 'pie',
                  pull:0.04,
                  marker:{
                      line:{
                          width:2
                      }
                  },
                }];

                var layout = {
                  annotations: [
                    {
                      font: {
                        size: 14
                      },
                      showarrow: false,
                      text: 'Classement',
                      x: 0.5,
                      y: 0.5
                    }
                  ],
                   legend:{
                       x:0.7,
                       y:1.15
                   }
                };

                Plotly.newPlot('plotly_pie', data, layout);

                $('#spin_communities_ranking').hide();
                $('#plotly_pie').show();
            });

        },
        function(data, status, headers, config) {
            if (status==-1) {
                //do nothing
            } else {
                showAlertError("Erreur lors de la récupération de la liste des communautés ; erreur HTTP : " + status);
            }
            $('#spin_communities_ranking').hide();
        });

    }

    function fillValuesAndLabels(communities, category) {

        $scope.labels = [];
        $scope.values = [];
        var tasks = [];
        for (var index = 0; index < communities.length; ++index) {
            community = communities[index];

            // array of deferreds :
            tasks.push(

                $.get('/communities/apiv1.0/communities/'+community.com_id+'/ranking?filter='+category+'&requester=COMMUNITIES_RANKING')
                .then(function(answer) {
                    $scope.rankings = answer.data.rankings;

                    if ($scope.rankings.length != 0) {
                        nbPointsTot = 0;
                        for (var index = 0; index < $scope.rankings.length; ++index) {
                            ranking = $scope.rankings[index];
                            nbPointsTot = nbPointsTot + ranking.nbPoints;
                        }

                        if (nbPointsTot == 0) {
                            // Just here to display a donut until the competition start
                            $scope.values.push(1);
                        } else{
                            $scope.values.push(nbPointsTot / $scope.rankings.length);
                        }
                        $scope.labels.push($scope.rankings[0].communities[0].title);
                    }
                },
                function(data, status, headers, config) {
                    if (status==-1) {
                        //do nothing
                    } else {
                        showAlertError("Erreur lors de la récupération du classement de la communauté ; erreur HTTP : " + status);
                    }
                })
            );

        }

        return tasks;

    }

    // Aborts the $http request if it isn't finished.
    $scope.$on('$destroy', function(){
        hideAlerts();
        canceler.resolve();
    });

}]);