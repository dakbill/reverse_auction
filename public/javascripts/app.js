var reverse_auction = angular.module('reverse-auction',['ngRoute']);

var socket;


reverse_auction.factory('ReverseAuctionService', ['$q','$http', function ($q, $http) {
    return {
        create_auction: function (auction) {
            var defer = $q.defer();
            $http.post('/auctions',auction).then(function(response){
                defer.resolve(response.data);
            });
            return defer.promise;
        }
    }
}]);

reverse_auction.factory('FacebookService', ['$q', function ($q) {
    return {
        login: function () {
            var defer = $q.defer();
            FB.login(function (response) {
                if (response.authResponse) {
                    defer.resolve(response);
                } else {
                    console.log('User cancelled login or did not fully authorize.');
                }
            }, {scope: 'public_profile,email'});
            return defer.promise;
        }
    }
}]);

reverse_auction.run(function($rootScope,$location,FacebookService){
    $rootScope.facebook_login = function(){
        FacebookService.login().then(function(response){
            if(response.status == 'connected'){
                FB.api('/me',function(user){
                    localStorage.setItem('user',JSON.stringify({id:user.id, name: user.name}));
                    $location.url('/auctions/create');
                })
            }

        });
    }
});


reverse_auction.config(['$routeProvider',function($routeProvider){
    $routeProvider
        .when('/auctions/create',{
            controller:'CreateAuctionController',
            templateUrl:'/templates/create_auction.html'
        })
        .when('/auctions/:auctionId',{
            controller:'AuctionController',
            templateUrl:'/templates/auction.html'
        })
        .when('/',{
            controller:'HomeController',
            templateUrl:'/templates/home.html'
        })
        .otherwise({redirect:'/'});
}]);

reverse_auction.controller('HomeController',function($scope,$location){
    $scope.init = function(){

    };

    $scope.$on('$viewContentLoaded',function(){

    });


});

reverse_auction.controller('CreateAuctionController',function($scope,$location,ReverseAuctionService){
    $scope.init = function(){
        $scope.auction = {};
        $scope.user = JSON.parse(localStorage.getItem('user'));
    };

    $scope.$on('$viewContentLoaded',function(){


    });

    $scope.create_auction = function(){

        $scope.auction.userId = $scope.user.id;
        ReverseAuctionService.create_auction($scope.auction).then(function(response){
            var auction_channel = '/'+response.results.auctionId;
            localStorage.setItem('auction_channel',auction_channel);
            socket = io(auction_channel);
            $location.url('/auctions'+auction_channel);
        });


    }


});

reverse_auction.controller('AuctionController',function($scope,$routeParams){
    $scope.init = function(){
        $scope.user = JSON.parse(localStorage.getItem('user'));
        $scope.messages = [];
    };

    $scope.$on('$viewContentLoaded',function(){
        var auction_channel = '/'+$routeParams.auctionId;
        socket = socket || io(auction_channel);

        socket.on('message',function(message){
            $scope.messages = [message].concat($scope.messages);
            $scope.$apply();
        });

    });


});