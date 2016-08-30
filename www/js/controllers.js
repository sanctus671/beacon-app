angular.module('app.controllers', [])

.controller('TabsCtrl', function($scope, $rootScope, MainService, $cordovaBeacon, AuthService, $ionicPlatform) {
    
    $rootScope.rangedBeacons = [];
    $rootScope.inRangeBeacons = [];
    $ionicPlatform.ready(function() {
        
        $cordovaBeacon.requestWhenInUseAuthorization();
        
        $rootScope.$on("$cordovaBeacon:didRangeBeaconsInRegion", function(event, pluginResult) {
            console.log(event);
            var uniqueBeaconKey;
            for(var i = 0; i < pluginResult.beacons.length; i++) {
                uniqueBeaconKey = pluginResult.beacons[i].uuid + ":" + pluginResult.beacons[i].major + ":" + pluginResult.beacons[i].minor;
                $rootScope.inRangeBeacons[uniqueBeaconKey] = pluginResult.beacons[i];
            }
            console.log($rootScope.inRangeBeacons);
            $scope.$apply();
        });
        MainService.getBeacons().then(function(data){
            $rootScope.rangedBeacons = data;
            for (var index in $rootScope.rangedBeacons){
                var beacon = $rootScope.rangedBeacons[index];
                console.log("ranging for " + beacon.uuid + ":" + beacon.major + ":" + beacon.minor);
                $cordovaBeacon.startRangingBeaconsInRegion($cordovaBeacon.createBeaconRegion("estimote" + index, beacon.uuid, beacon.major, beacon.minor));
            }
        });
 
    });
})




.controller('NotificationsCtrl', function($scope, $cordovaBeacon, $rootScope) {
    $scope.notifications = [];
    
    $scope.beacons = [];

    
    

    
    
    
    
    
    
})



.controller('DragCtrl', function($scope, MainService, AuthService, $rootScope, $cordovaBeacon, $ionicModal, $cordovaDeviceMotion, $cordovaGeolocation, $cordovaDevice) {
    $scope.advert = {};

    $scope.beacons = [];

    
    

    
    
    $ionicModal.fromTemplateUrl('templates/modals/advert.html', {
        scope: $scope,
        animation: 'slide-in-down'
    }).then(function(modal) {
        $scope.advertModal = modal;
    });    
    
    $scope.openAdvertModal = function(){
        $scope.advertModal.show();
    }
    
    //scan for beacons
    //wait for acceleromoter motion
    //if accelermotor condition is met, get the closest beacon and move it onto screen
    
    
    
    
    $scope.getAdvert = function(beacon){
        MainService.getAdvert(beacon).then(function(data){
            $scope.advert = data; //TODO display advert in modal with actions
            //open modal
        },function(data){
            if (data.status_code === 401){
                AuthService.register();
            } 
        })        
    }
    $scope.acceleration = {};
    // watch Acceleration
    document.addEventListener("deviceready", function(){
        var watch = $cordovaDeviceMotion.watchAcceleration({ frequency: 1000 });
        watch.then(
          null,
          function(error) {
          // An error occurred
          console.log(error);
          },
          function(result) {
            var x = result.x;
            var y = result.y;
            var z = result.z;
            var timeStamp = result.timestamp;
            
            if ($scope.acceleration.y < 8 && y > 8 && $scope.acceleration.z > 3 && z > -3 && z < 3){console.log("grabbed")}
            if (($scope.acceleration.y < 8 && y > 8 && $scope.acceleration.z > 3 && z > -3 && z < 3) && $scope.beacons.length > 0){ //TODO have condition for phone acceleration
                console.log("hey its met");
                var beacon = $scope.beacons[0]; //TODO find cloest beacon
                $scope.getAdvert(beacon); //TODO add uuid, minor, major into api instead of beacon code
                $scope.advertModal.show();                
            }
            $scope.acceleration = result;
        });
    },false);
    
 
  
    
    $scope.saveRecord = function(action){ //executed when an action is made on an advert
        $cordovaGeolocation
          .getCurrentPosition({timeout: 10000, enableHighAccuracy: false})
          .then(function (position) {
            var lat  = position.coords.latitude
            var long = position.coords.longitude
            console.log(position);
            var uuid = $cordovaDevice.getUUID();
            var record = {advert_id: $scope.advert.id, action:action, device: $rootScope.devicePlatform + ionic.Platform.version(), device_id: uuid, location:lat + ", " + long}
            MainService.saveRecord(record);
          }, function(err) {
            // error
          });        
    }
    
    
    
})

.controller('CollectionCtrl', function($scope, MainService, AuthService) {
    $scope.loading = false;
    $scope.records = [];
    $scope.doRefresh = function(){  
        $scope.loading = true;
        MainService.getRecords().then(function(data){
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
