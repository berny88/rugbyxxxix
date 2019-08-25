betApp.controller('ChatCtrl', ['$scope', '$routeParams', '$http', '$q', '$location', '$timeout', '$window',
                            function ($scope, $routeParams, $http, $q, $location, $timeout, $window) {

        var canceler = $q.defer();

        hideAlerts();

        $('#inputText').summernote(
        {
          height: 200,                 // set editor height
          minHeight: null,             // set minimum height of editor
          maxHeight: null,             // set maximum height of editor
          focus: true,                  // set focus to editable area after initializing summernote
          placeholder: 'Here !'
        }
        );

        $scope.getPosts = function() {
            hideAlerts();
            $http.get('chat/apiv1.0/posts', {timeout: canceler.promise})
            .success(function(data, status, headers, config) {
                $scope.posts = data;
                $('#spin').hide();
            })
            .error(function(data, status, headers, config) {
                if (status==-1) {
                    //do nothing
                } else {
                    showAlertError("Erreur lors de la récupération de la liste des posts ; erreur HTTP : " + status);
                }
                $('#spin').hide();
            });
            $('#postList').show();
        }

        $scope.doPost = function() {

            var postSize = Math.round(($('#inputText').summernote('code')).length / 1024);

            if ($('#inputText').summernote('isEmpty')) {
                $.notify("Post empty !" , "error");
                $('#inputText').summernote('focus');
            } else if (postSize > 600) { // we test "600" because of the html tags
                $.notify("Post too big (" + postSize + "ko) ; must be < 500 ko) ! " , "error");
                $('#inputText').summernote('focus')
            } else {
                var currentUser = {};
                if (isConnected($window)) {
                    currentUser = getConnectedUser($window);
                }

                var newPost = {};
                newPost.post_user_id = currentUser.user_id;
                //newPost.message = $('#inputText').val();
                newPost.message = $('#inputText').summernote('code');
                newPost.date = new Date();
                newPost.nickName = currentUser.nickName;

                $http.post('chat/apiv1.0/posts', {postToCreate: newPost, timeout: canceler.promise})
                .success(function(data, status, headers, config) {
                    newPost.post_id = data.post.post_id;
                    $scope.posts.posts.unshift(newPost);
                    $.notify("Post added !!" , "success");
                })
                .error(function(data, status, headers, config) {
                    if (status==-1) {
                        //do nothing
                    } else {
                        showAlertError("Erreur lors de la création du post ; erreur HTTP : " + status);
                    }
                })

                $('#inputText').summernote('focus');
                $('#inputText').summernote('reset');
            }

        }

        $scope.deletePost = function(post) {
            hideAlerts();
            $http.delete('chat/apiv1.0/posts/' + post.post_id, {timeout: canceler.promise})
            .success(function(data, status, headers, config) {
                $scope.posts = data;
                $.notify("Post deleted !!" , "success");
            })
            .error(function(data, status, headers, config) {
                if (status==-1) {
                    //do nothing
                } else if (status==403){
                    showAlertError("Même pas en rêve ! status=" + status+ " " + data);
                } else {
                    showAlertError("Erreur lors de la suppression du post ; erreur HTTP : " + status);
                }
            });
        }

        $scope.hasAuthorization = function(post) {
            var currentUser = {};
            if (isConnected($window)) {
                currentUser = getConnectedUser($window);
            }
            return ((currentUser.user_id == post.post_user_id) || isAdmin($window)) ? true : false;
        }

        // only the connected people can post a message
        $scope.isConnected = function() {
            // security.js :
            return isConnected($window);
        }

        // Aborts the $http request if it isn't finished.
        $scope.$on('$destroy', function(){
            hideAlerts();
            canceler.resolve();
        });

}]);