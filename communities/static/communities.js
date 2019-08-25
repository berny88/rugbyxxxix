betApp.controller('CommunitiesCtrl', ['$scope', '$routeParams', '$http', '$q', '$location', '$timeout', '$window',
                            function ($scope, $routeParams, $http, $q, $location, $timeout, $window) {

        var canceler = $q.defer();

        $scope.sortType     = ''; // set the default sort type
        $scope.sortReverse  = false;  // set the default sort order

        $scope.community = {};
        $scope.communityToDelete = {};
        $scope.communities = {};
        hideAlerts();

        // BEGIN-countdown
        function js_yyyy_mm_dd_hh_mm_ss (myDate) {
          year = "" + myDate.getFullYear();
          month = "" + (myDate.getMonth() + 1); if (month.length == 1) { month = "0" + month; }
          day = "" + myDate.getDate(); if (day.length == 1) { day = "0" + day; }
          hour = "" + myDate.getHours(); if (hour.length == 1) { hour = "0" + hour; }
          minute = "" + myDate.getMinutes(); if (minute.length == 1) { minute = "0" + minute; }
          second = "" + myDate.getSeconds(); if (second.length == 1) { second = "0" + second; }
          return year + "-" + month + "-" + day + " " + hour + ":" + minute + ":" + second;
        }

        $scope.injectCounter = function() {

            var startDateUTC = new Date('9/20/2019 12:45:00 UTC');
            $scope.startDateLocal = js_yyyy_mm_dd_hh_mm_ss(startDateUTC);

            // injection in HTML :
            $("#counter").html("<div id='DateCountdown' data-date='"+$scope.startDateLocal+"' style='width: 100%;'></div>");

            $("#DateCountdown").TimeCircles({
                "animation": "smooth",
                "bg_width": 1.2,
                "fg_width": 0.1,
                "circle_bg_color": "#60686F",
                "time": {
                    "Days": {
                        "text": "Days",
                        "color": "#FFCC66",
                        "show": true
                    },
                    "Hours": {
                        "text": "Hours",
                        "color": "#99CCFF",
                        "show": true
                    },
                    "Minutes": {
                        "text": "Minutes",
                        "color": "#BBFFBB",
                        "show": true
                    },
                    "Seconds": {
                        "text": "Seconds",
                        "color": "#FF9999",
                        "show": true
                    }
                }
            });
        }
        // END-countdown

        $scope.getCommunities = function() {
            hideAlerts();
            $http.get('communities/apiv1.0/communities', {timeout: canceler.promise})
            .then(function(answer, status, headers, config) {
                $scope.communities = answer.data;
                $('#spin').hide();
            }
            ,function(data, status, headers, config) {
                if (status==-1) {
                    //do nothing
                } else {
                    showAlertError("Erreur lors de la récupération de la liste des communautés ; erreur HTTP : " + status);
                }
                $('#spin').hide();
            });
        }

        $scope.getMyCommunities = function() {
            hideAlerts();
            if (getConnectedUser($window)){
                $http.get('communities/apiv1.0/communities?userId='+getConnectedUser($window).user_id, {timeout: canceler.promise})
                .then(function(answer, status, headers, config) {
                    $scope.my_communities = answer.data.communities;
                    console.log(answer.data);
                    $('#spin').hide();
                },
                function(data, status, headers, config) {
                    if (status==-1) {
                        //do nothing
                    } else {
                        showAlertError("Erreur lors de la récupération de la liste des communautés ; erreur HTTP : " + status);
                    }
                    $('#spin').hide();
                });
            }
        }

        $scope.getCommunity = function() {
            hideAlerts();
            $http.get('communities/apiv1.0/communities/' + $routeParams.com_id, {timeout: canceler.promise})
            .then(function(answer, status, headers, config) {
                $scope.community = answer.data;
            }
            ,function(data, status, headers, config) {
                if (status==-1) {
                    //do nothing
                } else {
                    showAlertError("Erreur lors de la récupération de la communauté ; erreur HTTP : " + status);
                }
            });

            $scope.displayBlogPostSaveButton = false;
            console.log("getCommunity::isConnected($window)="+isConnected($window));
            if (isConnected($window)) {
                $scope.displayBlogPostSaveButton =true;
            }

        }

        $scope.updateCommunity = function() {
            hideAlerts();
            $scope.communityToUpdate = $scope.community.community;
            $http.put('communities/apiv1.0/communities', {communityToUpdate: $scope.communityToUpdate, timeout: canceler.promise})
            .then(function(answer, status, headers, config) {
                $location.path("/communities")
                //$timeout(function() {
                //       showAlertSuccess("Communauté modifiée avec succès !!");
                //    }, 1000);
                $.notify("Community successfully updated !!" , "success");
            },
            function(data, status, headers, config) {
                if (status==-1) {
                    //do nothing
                } else if (status==403){
                    showAlertError("Même pas en rêve ! status=" + status+ " " + data);
                } else {
                    showAlertError("Erreur lors de la modification de la communauté ; erreur HTTP : " + status);
                }
            });
        }

        $scope.createCommunity = function() {
            hideAlerts();
            $scope.communityToCreate.admin_user_id = getConnectedUser($window).user_id;
            $http.post('communities/apiv1.0/communities', {communityToCreate: $scope.communityToCreate, timeout: canceler.promise})
            .then(function(answer, status, headers, config) {
                $location.path("/communities")
                //$timeout(function() {
                //       showAlertSuccess("Communauté créée avec succès !!");
                //    }, 1000);
                $.notify("Community successfully created !!" , "success");

            },
            function(data, status, headers, config) {
                if (status==-1) {
                    //do nothing
                } else {
                    showAlertError("Erreur lors de la création de la communauté ; erreur HTTP : " + status);
                }
            });
        }

        $scope.deleteCommunity = function(communityToDelete) {
            $scope.communityToDelete = communityToDelete;
            showModal();
        }

        // launched when the "OK" button of the confirmation modal is pressed :
        $scope.confirm = function() {
            hideAlerts();
            $http.delete('communities/apiv1.0/communities/' + $scope.communityToDelete.com_id, {timeout: canceler.promise})
            .then(function(answer, status, headers, config) {
                $scope.communities = answer.data;
                closeModal();
                //showAlertSuccess("Communauté [" + $scope.communityToDelete.title + "] supprimée avec succès !");
                $.notify("Community [" + $scope.communityToDelete.title + "] successfully removed !" , "success");
            },
            function(data, status, headers, config) {
                closeModal();
                if (status==-1) {
                    //do nothing
                } else if (status==403){
                    showAlertError("Même pas en rêve ! status=" + status+ " " + data);
                } else {
                    showAlertError("Erreur lors de la suppression de la communauté ; erreur HTTP : " + status);
                }
            });
        }

        $scope.getNumberOfPlayersInCommunity = function(com_id) {
            hideAlerts();
            $http.get('communities/apiv1.0/communities/' + com_id + '/getplayersnumber', {timeout: canceler.promise})
            .then(function(answer, status, headers, config) {
                $('#nbPlayers_'+com_id).html(answer.data.playerCount);
            },
            function(data, status, headers, config) {
                if (status==-1) {
                    //do nothing
                } else {
                    showAlertError("Erreur lors de la récupération du nombre de parieurs dans la communauté ; erreur HTTP : " + status);
                }
            });
        }

        // to avoid the cache of the images (avatars)
        d = new Date();
        $scope.currentDateForAvoidTheCache = d.getTime();

        $scope.getPlayersInCommunity = function() {
            hideAlerts();
            $http.get('communities/apiv1.0/communities/' + $routeParams.com_id + '/players', {timeout: canceler.promise})
            .then(function(answer, status, headers, config) {
                $scope.players = answer.data;
            },
            function(data, status, headers, config) {
                if (status==-1) {
                    //do nothing
                } else {
                    showAlertError("Erreur lors de la récupération des parieurs dans la communauté ; erreur HTTP : " + status);
                }
            });
        }

        $scope.getCommunityForUpdate = function() {
            $scope.getCommunity();
            $('#title').focus();
        }


        $scope.setFocusWhenCreatingCommunity= function() {
            $('#title').focus();
        }

        $scope.getRankingInCommunity = function(category) {
            $('#spinRanking').show();
            $('#spinBets').show();
            $('#divRanking').hide();
            $('#divBets').hide();

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

            $http.get('/communities/apiv1.0/communities/'+$routeParams.com_id+'/ranking?filter='+category, {timeout: canceler.promise})
            .then(function(answer) {
                $scope.rankings = answer.data;
                $('#spinRanking').hide();
                $('#divRanking').show();
                $('#divBets').show();
                $('#spin').hide();
                $('#spinBets').hide();

                // to display the score when the match begins
                $scope.rankings.data.rankings.forEach(function(ranking) {
                    ranking.communities[0].bets.forEach(function(bet) {
                        if (Date.parse(bet.dateDeadLineBet) > new Date()) {
                            bet.notClosed = true;
                        } else {
                            bet.notClosed = false;
                        }
                    });
                })

            },
            function(data, status, headers, config) {
                if (status==-1) {
                    //do nothing
                } else {
                    showAlertError("Erreur lors de la récupération du classement de la communauté ; erreur HTTP : " + status);
                }
                $('#spin').hide();
                $('#spinBets').hide();
                $('#spinRanking').hide();
            });
        }

        $scope.getBetsOfTheDayInCommunity = function() {
            $http.get('/communities/apiv1.0/communities/'+$routeParams.com_id+'/betsoftheday', {timeout: canceler.promise})
            .then(function(answer) {
                $scope.betsOfTheDay = data.data.rankings.betsOfTheDay;
                $scope.matchs = data.data.rankings.matchs;
                $('#spin').hide();

                // to display the score when the match begins
                $scope.betsOfTheDay.forEach(function(betOfTheDay) {
                    betOfTheDay.bets.forEach(function(bet) {
                        if (Date.parse(bet.dateDeadLineBet) > new Date()) {
                            bet.notClosed = true;
                        } else {
                            bet.notClosed = false;
                        }
                    });
                })

            },
            function(data, status, headers, config) {
                if (status==-1) {
                    //do nothing
                } else {
                    showAlertError("Erreur lors de la récupération des paris du jour de la communauté ; erreur HTTP : " + status);
                }
                $('#spin').hide();
            });
        }

        $scope.hasAuthorization = function(community) {
            var currentUser = {};
            if (isConnected($window)) {
                currentUser = getConnectedUser($window);
            }
            return ((currentUser.user_id == community.admin_user_id) || isAdmin($window)) ? true : false;
        }

        // only the connected people can create/delete/modify a community
        $scope.isConnected = function() {
            // security.js :
            console.log("isConnected = ",getConnectedUser($window));
            return isConnected($window);
        }

        // Aborts the $http request if it isn't finished.
        $scope.$on('$destroy', function(){
            hideAlerts();
            canceler.resolve();
        });


/* *********** */
/* Blog block  */
/* *********** */
    var blog = this;
    $scope.title = "The blog";

    $scope.posts = {};
    // $http.get('communities/apiv1.0/communities/' + $routeParams.com_id + '/blogs').then(function(answer){
    //   $scope.posts = data.data.blogs;
    // });

    $scope.tab = 'CommunitiesCtrl';

    $scope.selectTab = function(setTab){
      $scope.tab = setTab;
      console.log("select tab " + $scope.tab)
    };

    $scope.isSelected = function(checkTab){
      //console.log("isSelected checkTab=" + checkTab + " / $scope.tab=" + $scope.tab)
      return $scope.tab === checkTab;
    };

    $scope.incLikes= function(post){
      console.log("inc likes" + post.likes)
      post.likes = post.likes +1;
    };

    $scope.post = {};
    $scope.addPost = function(){
        $scope.post.createdOn = Date.now();
        $scope.post.author = getConnectedUser($window).nickName;
        $scope.post.comments = [];
        $scope.post.likes = 0;
        $scope.tab = 0;
        console.log("addPost :: post=" + $scope.post + " / user="+getConnectedUser($window).email);
        console.log("addPost :: post.body=" + $scope.post.body );
        console.log("addPost :: post.post.emailOpt=" + $scope.post.emailOpt );
          //TODO faire les contrôles de sécu coté client
        hideAlerts();
        $http.post('communities/apiv1.0/communities/' + $routeParams.com_id + '/blogs', {blogpost: $scope.post, timeout: canceler.promise})
        .then(function(answer, status, headers, config) {
            console.log("new blog_id="+data.blog.blog_id)
            $scope.post = data.blog
            $scope.posts.unshift($scope.post);
            $.notify("Post successfully created !!" , "success");
            $scope.selectTab('CommunitiesCtrl')
            $scope.post ={};
        },
        function(data, status, headers, config) {
            if (status==-1) {
                //do nothing
            } else {
                showAlertError("Erreur lors de la création du post; erreur HTTP : " + status);
            }
        });
    };

    $scope.deletePost = function(index){
        hideAlerts();
        console.log("deletePost :: post index=" + index);
        post = $scope.posts[index];
        console.log("deletePost :: post.blog_id =" + post.blog_id);
        $scope.posts.splice(index, 1);
        console.log("after deletePost :: posts=" + $scope.posts);
        $http.delete('communities/apiv1.0/communities/' + $routeParams.com_id + '/blogs/'+post.blog_id,
         { timeout: canceler.promise})
        .then(function(answer, status, headers, config) {
            $.notify("Post removed successfully !!" , "success");
            $scope.selectTab('CommunitiesCtrl')
        },
        function(data, status, headers, config) {
            if (status==-1) {
                //do nothing
            } else {
                showAlertError("Erreur lors de la suppression du post; erreur HTTP : " + status);
            }
        });
    };

    $scope.sendEmailToMe = function(post){
        console.log("sendEmailToMe::Connected user= "+getConnectedUser($window));
        console.log("\tsendEmailToMe::blog_id= "+post.blog_id);
        hideAlerts();
        $http.put('communities/apiv1.0/communities/' + $routeParams.com_id + '/blogs/'+post.blog_id+'?type=me',
                    {comment: $scope.comment, timeout: canceler.promise})
        .then(function(answer, status, headers, config) {
            console.log("send email to me="+data.msg)
            $.notify("Email sent !!" , "success");
        },
        function(data, status, headers, config) {
            if (status==-1) {
                //do nothing
            } else {
                showAlertError("Erreur lors l'envoi de l'email; erreur HTTP : " + status);
            }
        });
    }

    $scope.sendEmailToAll = function(post){
        console.log("sendEmailToAll::blog_id= "+post.blog_id);
        hideAlerts();
        $http.put('communities/apiv1.0/communities/' + $routeParams.com_id + '/blogs/'+post.blog_id+'?type=all',
                    {comment: $scope.comment, timeout: canceler.promise})
        .then(function(answer, status, headers, config) {
            console.log("send email to all="+data.msg)
            $.notify("Email sent !!" , "success");
        },
        function(data, status, headers, config) {
            if (status==-1) {
                //do nothing
            } else {
                showAlertError("Erreur lors l'envoi de l'email; erreur HTTP : " + status);
            }
        });
    }

    $scope.comments = {};
    $scope.comment = {};

    $scope.addComment = function(post){
        $scope.comment.createdOn = Date.now();
        if (getConnectedUser($window) == null){
            console.log("addComment::Connected user= "+getConnectedUser($window));
            showAlertError("unauthenticated user ! You must be connected");
            return;
        }
        $scope.comment.author= getConnectedUser($window).nickName;
        console.log("addComment:: $scope.comments=" + $scope.comments);
        post.comments.push($scope.comment);
        console.log("addComment:: try to add comment:: post=" + post.blog_id);
        console.log("addComment:: try to add comment:: comment.author=" + $scope.comment.author);
        console.log("addComment:: try to add comment:: comment.body=" + $scope.comment.body);
        hideAlerts();
        $http.post('communities/apiv1.0/communities/' + $routeParams.com_id + '/blogs/'+post.blog_id+'/comments',
                    {comment: $scope.comment, timeout: canceler.promise})
        .then(function(answer, status, headers, config) {
            console.log("new comment result="+data.msg)
            $.notify("Comment successfully created !!" , "success");
            $scope.comment ={};
        },
        function(data, status, headers, config) {
            if (status==-1) {
                //do nothing
            } else {
                showAlertError("Erreur lors de la création du post; erreur HTTP : " + status);
            }
        });
    };

}]);

