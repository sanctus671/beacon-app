angular.module('app.controllers', [])

.controller('NotificationsCtrl', function($scope) {
    $scope.notifications = [];
    
    //scan for beacons
    //push the beacons into notifcations
    
    
    
    
})



.controller('DragCtrl', function($scope, MainService, AuthService) {
    $scope.advert = {};
    
    //scan for beacons
    //wait for acceleromoter motion
    //if accelermotor condition is met, get the closest beacon and move it onto screen
    
    
    $scope.getAdvert = function(beacon){
        MainService.getAdvert(beacon).then(function(data){
            $scope.advert = data;
            //open modal
        },function(data){
            if (data.status_code === 401){
                AuthService.register();
            } 
        })        
    }
    
    
})

.controller('CollectionCtrl', function($scope, MainService, AuthService) {
    $scope.loading = false;
    $scope.records = [];
    $scope.doRefresh = function(){  
        $scope.loading = true;
        MainService.getTeams().then(function(data){
            $scope.loading = false;
            $scope.$broadcast('scroll.refreshComplete');
            $scope.records = data;
        },function(data){
            $scope.$broadcast('scroll.refreshComplete');
            if (data.status_code === 401){
                AuthService.register();
            } 
        })
    }
    $scope.doRefresh();   
})




;
