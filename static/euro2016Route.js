// configure our routes
euro2016App.config(function($routeProvider) {

    $routeProvider

        // route for index
        .when('/accueil', { templateUrl:'static/accueil.html', controller:'CommunitiesCtrl' })
        .when('/accueil2', { templateUrl:'static/accueil.html', controller:'CommunitiesCtrl' })
        .when('/accueil3', { templateUrl:'static/accueil.html', controller:'CommunitiesCtrl' })
        .when('/', { templateUrl:'static/accueil.html', controller:'CommunitiesCtrl' })

        //subscription process
        // to subscribe to the site
        .when('/signon', { templateUrl:'users/static/logon.html', controller:'indexCtrl' })
        // just page to confirm email sent
        .when('/logon_successfull', { templateUrl:'users/static/logon_successfull.html', controller:'indexCtrl' })

        // route for list of users
        .when('/users', { templateUrl:'users/static/users.html', controller:'UsersListCtrl' })
        // user page modification
        .when('/user_detail/:user_id', { templateUrl:'users/static/user.html', controller:'UserDetailCtrl' })

        // to sign in
        .when('/signin', { templateUrl:'users/static/signin.html', controller:'LoginCtrl' })
        // to logout
        .when('/logout', { templateUrl:'users/static/logout.html', controller:'LogoutCtrl' })

        // route for communities
        .when('/communities', { templateUrl:'communities/static/communities.html', controller:'CommunitiesCtrl' })
        .when('/view_community/:com_id', { templateUrl:'communities/static/view_community.html', controller:'CommunitiesCtrl' })
        .when('/create_community', { templateUrl:'communities/static/create_community.html', controller:'CommunitiesCtrl' })
        .when('/update_community/:com_id', { templateUrl:'communities/static/update_community.html', controller:'CommunitiesCtrl' })
		.when('/bets_of_the_day_in_community/:com_id', { templateUrl:'communities/static/bets_of_the_day_in_community.html', controller:'CommunitiesCtrl' })
		.when('/bet_in_community/:com_id', { templateUrl:'communities/static/bet_in_community.html', controller:'CommunitiesCtrl' })
		.when('/rank_in_community/:com_id', { templateUrl:'communities/static/rank_in_community.html', controller:'CommunitiesCtrl' })
		.when('/bets_in_community/:com_id', { templateUrl:'communities/static/bets_in_community.html', controller:'CommunitiesCtrl' })
		.when('/blog_in_community/:com_id', { templateUrl:'communities/static/blog_in_community.html', controller:'CommunitiesCtrl' })

        // route for matchs page: "static page"
        .when('/matchs', { templateUrl:'matchs/static/matchs.html', controller:'matchsCtrl' })
        .when('/admin_matchs', { templateUrl:'matchs/static/admin_matchs.html', controller:'matchsCtrl' })

        // route for stats: "buble graph" & ranking
        .when('/stats_1', { templateUrl:'stats/static/stats_1.html', controller:'statsMatchsCtrl' })
        .when('/stats_2', { templateUrl:'stats/static/stats_2.html', controller:'statsHuitMatchsCtrl' })
        .when('/stats_ranking', { templateUrl:'stats/static/stats_ranking.html', controller:'statsRankingCtrl' })
        .when('/stats_global', { templateUrl:'stats/static/stats_global.html', controller:'statsRankingCtrl' })
        .when('/stats_historyranking', { templateUrl:'stats/static/stats_historyranking.html', controller:'statsRankingCtrl' })
        .when('/stats_communities_ranking', { templateUrl:'stats/static/stats_communities_ranking.html', controller:'statsRankingCtrl' })

        // route for tirage: "static page"
        .when('/tirage', { templateUrl:'static/tirage.html', controller:'tirageCtrl' })

        // route for calendrier: "static page"
        .when('/calendrier', { templateUrl:'static/calendrier.html', controller:'calendrierCtrl' })

        // route for pictures and videos
        .when('/entertainment', { templateUrl:'static/entertainment.html', controller:'indexCtrl' })

        // route for rules of games and bets : "static page"
        .when('/rules', { templateUrl:'static/rules.html', controller:'indexCtrl' })

        // route for about page : "static page"
        .when('/about', { templateUrl:'static/about.html', controller:'indexCtrl' })

        // route for about page : "static page"
        .when('/contact', { templateUrl:'static/contact.html', controller:'indexCtrl' })

        // default
        .otherwise({ templateUrl:'static/accueil.html', controller:'CommunitiesCtrl' });
});