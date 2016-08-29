angular.module('app.controllers', [])

.controller('TabsCtrl', function($scope, $rootScope, MainService, $cordovaBeacon, AuthService) {
    $rootScope.beacons = [];
    document.addEventListener("deviceready", function(){
        MainService.getBeacons().then(function(data){
            $rootScope.beacons = data;
            console.log($rootScope.beacons);
            if (window.cordova && window.cordova.plugins && window.cordova.plugins.locationManager){
                for (var index in $rootScope.beacons){
                    var beacon = $rootScope.beacons[index];
                    console.log("ranging for beacon " + beacon.uuid + beacon.major + beacon.minor)
                    $cordovaBeacon.startRangingBeaconsInRegion($cordovaBeacon.createBeaconRegion("adbeacon" + index, beacon.uuid, parseInt(beacon.major), parseInt(beacon.minor)));
                }
            }
        },function(data){
            $scope.$broadcast('scroll.refreshComplete');
            if (data.status_code === 401){
                AuthService.register();
            } 
        })   
    },false);
})




.controller('NotificationsCtrl', function($scope, $cordovaBeacon, $rootScope) {
    $scope.notifications = [];
    
    $scope.beacons = [];

    
    
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.locationManager){
        $cordovaBeacon.requestWhenInUseAuthorization();

        $rootScope.$on("$cordovaBeacon:didRangeBeaconsInRegion", function(event, pluginResult) {

            for(var i = 0; i < pluginResult.beacons.length; i++) {
                $scope.beacons.push(pluginResult.beacons[i]);
            }
            $scope.$apply();
        });
    } 
    
    
    
    
    
    
})



.controller('DragCtrl', function($scope, MainService, AuthService, $rootScope, $cordovaBeacon, $ionicModal, $cordovaDeviceMotion, $cordovaGeolocation, $cordovaDevice) {
    $scope.advert = {};

    $scope.beacons = [];

    
    
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.locationManager){
        $cordovaBeacon.requestWhenInUseAuthorization();

        $rootScope.$on("$cordovaBeacon:didRangeBeaconsInRegion", function(event, pluginResult) {
            for(var i = 0; i < pluginResult.beacons.length; i++) {
                $scope.beacons.push(pluginResult.beacons[i]);
            }
            console.log($scope.beacons);
            $scope.$apply();
        });
    } 
    
    
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
    
    // watch Acceleration
    document.addEventListener("deviceready", function(){
        var watch = $cordovaDeviceMotion.watchAcceleration({ frequency: 2000 });
        watch.then(
          null,
          function(error) {
          // An error occurred
          console.log(error);
          },
          function(result) {
            var X = result.x;
            var Y = result.y;
            var Z = result.z;
            var timeStamp = result.timestamp;
            if ((X > 1 && Y > 8 && Z > -1 && Z < 1) && $scope.beacons.length > 0){ //TODO have condition for phone acceleration
                var beacon = $scope.beacons[0]; //TODO find cloest beacon
                $scope.getAdvert(beacon); //TODO add uuid, minor, major into api instead of beacon code
                $scope.advertModal.show();                
            }
            console.log(result);
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
