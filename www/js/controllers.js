angular.module('app.controllers', [])

.controller('TabsCtrl', function($scope, $rootScope, MainService, $cordovaBeacon, AuthService, $ionicPlatform, $timeout) {
    
    $rootScope.rangedBeacons = [];
    //$rootScope.inRangeBeacons = {};
    $rootScope.inRangeBeacons = {
         "Beacon1":{proximity:"ProximityNear", uuid:"b9407f30-f5f8-466e-aff9-25556b57fe6d", major:"46387", minor:"36404"},
         "Beacon2" :{proximity:"ProximityImmediate", uuid:"b9407f30-f5f8-466e-aff9-25556b57fe6d", major:"46387", minor:"36404"}
         };    
     //demo to test local notifications    
     /*
    $timeout(function(){
        window.plugin.notification.local.add({
            id:         "1",  // A unique id of the notifiction
            message:    "Open the app and drag to view",  // The message that is displayed
            title:      "New advert in range",  // The title of the message
            sound:      true,
            autoCancel: true, // Setting this flag and the notification is automatically canceled when the user clicks it
            ongoing:    false, // Prevent clearing of notification (Android only)
        });         
    },10000)   
    */
    $ionicPlatform.ready(function() {
        
        if (window.cordova){$cordovaBeacon.requestWhenInUseAuthorization();}
        
        $rootScope.$on("$cordovaBeacon:didRangeBeaconsInRegion", function(event, pluginResult) {
            var uniqueBeaconKey;
            for(var i = 0; i < pluginResult.beacons.length; i++) {
                uniqueBeaconKey = pluginResult.beacons[i].uuid + ":" + pluginResult.beacons[i].major + ":" + pluginResult.beacons[i].minor;
                /*
                if (!(uniqueBeaconKey in $scope.inRangeBeacons)){
                    window.plugin.notification.local.add({
                        id:         uniqueBeaconKey,  // A unique id of the notifiction
                        message:    "Open the app and drag to view",  // The message that is displayed
                        title:      "New advert in range",  // The title of the message
                        sound:      true,
                        autoCancel: true, // Setting this flag and the notification is automatically canceled when the user clicks it
                        ongoing:    false, // Prevent clearing of notification (Android only)
                    });                     
                }
                */
                $rootScope.inRangeBeacons[uniqueBeaconKey] = pluginResult.beacons[i];
            }
            $scope.$apply();
        });
        
        $rootScope.$on("userRegistered", function(){
            console.log("test");
            MainService.getBeacons().then(function(data){
                $rootScope.rangedBeacons = data;
                for (var index in $rootScope.rangedBeacons){
                    var beacon = $rootScope.rangedBeacons[index];
                    if (window.cordova){$cordovaBeacon.startRangingBeaconsInRegion($cordovaBeacon.createBeaconRegion("estimote" + index, beacon.uuid, beacon.major, beacon.minor));}
                }
            });
        });
 
    });
})




.controller('NotificationsCtrl', function($scope, $cordovaBeacon, $rootScope) {
    $scope.notifications = [];
    
    $scope.getNotificationsLength = function(){
        return $scope.notifications.length + Object.keys($rootScope.inRangeBeacons).length;
    }
    

    
    
    
    
    
    
})



.controller('DragCtrl', function($scope, MainService, AuthService, $rootScope, $cordovaBeacon, $deviceGyroscope, $ionicPopup, $cordovaSocialSharing, $ionicModal, $cordovaDeviceMotion, $cordovaGeolocation, $cordovaDevice, $state) {

    $scope.modalOpen = false;
    $scope.advert = {};
    $scope.stage = 2;
    $scope.loading = true;
    $scope.pullCount = 0;
    
    $ionicModal.fromTemplateUrl('templates/modals/advert.html', {
        scope: $scope,
        animation: 'slide-in-down'
    }).then(function(modal) {
        $scope.advertModal = modal;
    });    
    
    $scope.openAdvertModal = function(){
        $scope.modalOpen = true;
        $scope.advertModal.show();
    }
    
    $scope.$on('modal.hidden', function() {
        $scope.modalOpen = false;
    });
    // Execute action on remove modal
    $scope.$on('modal.removed', function() {
        $scope.modalOpen = false;
    });    
    
    $scope.getBeaconCount = function(){
        return Object.keys($rootScope.inRangeBeacons).length;
    }

    
    $scope.getAdvert = function(beacon){
        $scope.modalOpen = true;
        $scope.advert = {};
        MainService.getAdvert(beacon).then(function(data){
            $scope.advert = data;
        },function(data){
            if (data.status_code === 401){
                AuthService.register();
            } 
        })        
    }
    $scope.acceleration = {};
    $scope.speed = {};
    document.addEventListener("deviceready", function(){
        var watch = $cordovaDeviceMotion.watchAcceleration({ frequency: 100 });
        watch.then(
          null,
          function(error) {
          // An error occurred
          $scope.loading = false;
          console.log(error);
          },
          function(result) {
            $scope.loading = false;
            var x = result.x;
            var y = result.y;
            var z = result.z;
            $scope.acceleration = result;
        });
        
        var gyroscope = $deviceGyroscope.watch({ frequency: 100 });
        gyroscope.then(
            null,
            function(error){
                console.log(error);
            },
            function(result){
                var x = result.x;
                var y = result.y;
                var z = result.z;
                var isMoving = x > 3 || x < -3 || y > 3 || z > 3 || z < -3;
                if ($scope.acceleration.y > 3 && isMoving && Object.keys($rootScope.inRangeBeacons).length > 0 && !$scope.modalOpen && $state.current.name === "tab.drag"){
                    console.log(result);
                    console.log("grabbed");
                    var beacon = {}; var proximity = false; 
                    for (var index in $rootScope.inRangeBeacons){
                        if ($rootScope.inRangeBeacons[index].proximity === "ProximityImmediate"){
                            beacon = $rootScope.inRangeBeacons[index];
                            proximity = "ProximityImmediate";
                            break;
                        }
                        else if ($rootScope.inRangeBeacons[index].proximity === "ProximityNear" && proximity !== "ProximityImmediate"){
                            beacon = $rootScope.inRangeBeacons[index];
                            proximity = "ProximityNear";
                        }
                        else if (proximity !== "ProximityImmediate" && proximity !== "ProximityNear"){
                            beacon = $rootScope.inRangeBeacons[index];
                        }
                    }
                    $scope.getAdvert(beacon);
                    $scope.advertModal.show();                
                } 
                $scope.speed = result;
            
            })
        
        
    },false);
    
 
    $scope.doAction = function(action){
        if (action === 'phonepopup'){
            $scope.openPhonePopup();
            return;
        }        
        $scope.saveRecord(action);
        if (action === 'phone'){
            window.open('tel:' + $scope.advert.phone, '_system')
        }
        else if (action === 'link'){
            window.open($scope.advert.link, "_system");
        }
        else if (action === 'location'){
            window.open("https://www.google.com/maps/place/" + $scope.advert.location, "_system");
        }
        else if (action === 'info'){
            $scope.openInfoPopup();
        }
        else if (action === 'share'){
            $cordovaSocialSharing
                .share($scope.advert.name, $scope.advert.name, null, $scope.advert.image) // Share via native share sheet
             
        }
    }
    
    $scope.openInfoPopup = function(){
        var alertPopup = $ionicPopup.alert({
          title: 'Information',
          template: '<span ng-show="advert.company">Company: ' + $scope.advert.company + '<br></span>\n\
                     <span ng-show="advert.category">Category: ' + $scope.advert.category + '<br></span>\n\
                     ' + $scope.advert.description
        });       
    }
    
    $scope.openPhonePopup = function(){
        $ionicPopup.confirm({
            title: 'Call',
            template: 'Are you sure you to call ' + $scope.advert.phone + '?'
          }).then(function(res){
              if (res){
                  $scope.doAction("phone");
              }
          });
          
    }    
    
    
    
    $scope.saveRecord = function(action){ //executed when an action is made on an advert
        $cordovaGeolocation
          .getCurrentPosition({timeout: 10000, enableHighAccuracy: false})
          .then(function (position) {
            var lat  = position.coords.latitude;
            var long = position.coords.longitude;
            console.log(position);
            var uuid = $cordovaDevice.getUUID();
            var record = {advert_id: $scope.advert.id, action:action, device: $rootScope.devicePlatform + ionic.Platform.version(), device_id: uuid, location:lat + ", " + long}
            MainService.saveRecord(record);
          }, function(err) {
            // error
          });        
    }
    
    
    
})

.controller('HistoryCtrl', function($scope, MainService, AuthService, $ionicModal, $cordovaSocialSharing, $ionicPopup, $cordovaGeolocation, $cordovaDevice, $rootScope) {
    $scope.loading = false;
    $scope.records = [];
    
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
    
    $scope.advert = {};

    $ionicModal.fromTemplateUrl('templates/modals/advert.html', {
        scope: $scope,
        animation: 'fade-in-scale'
    }).then(function(modal) {
        $scope.advertModal = modal;
    });    
    
    $scope.openAdvertModal = function(){
        $scope.advertModal.show();
    }

    
    $scope.getAdvert = function(recordId){
        $scope.advert = {};    
        for (var index in $scope.records){
            if ($scope.records[index].id === recordId){
                $scope.advert = $scope.records[index].advert;
            }
        } 
        if ($scope.advert.id){
            $scope.openAdvertModal();
        }
    }    
    
    $scope.doAction = function(action){
        if (action === 'phonepopup'){
            $scope.openPhonePopup();
            return;
        }        
        $scope.saveRecord(action);
        if (action === 'phone'){
            window.open('tel:' + $scope.advert.phone, '_system')
        }
        else if (action === 'link'){
            window.open($scope.advert.link, "_system");
        }
        else if (action === 'location'){
            window.open("https://www.google.com/maps/place/" + $scope.advert.location, "_system");
        }
        else if (action === 'info'){
            $scope.openInfoPopup();
        }
        else if (action === 'share'){
            $cordovaSocialSharing
                .share($scope.advert.name, $scope.advert.name, null, $scope.advert.image) // Share via native share sheet
             
        }
    }
    
    $scope.openInfoPopup = function(){
        var alertPopup = $ionicPopup.alert({
          title: 'Information',
          template: '<span ng-show="advert.company">Company: ' + $scope.advert.company + '<br></span>\n\
                     <span ng-show="advert.category">Category: ' + $scope.advert.category + '<br></span>\n\
                     ' + $scope.advert.description
        });       
    }
    
    $scope.openPhonePopup = function(){
        $ionicPopup.confirm({
            title: 'Call',
            template: 'Are you sure you to call ' + $scope.advert.phone + '?'
          }).then(function(res){
              if (res){
                  $scope.doAction("phone");
              }
          });
          
    } 
    
    $scope.saveRecord = function(action){ //executed when an action is made on an advert
        $cordovaGeolocation
          .getCurrentPosition({timeout: 10000, enableHighAccuracy: false})
          .then(function (position) {
            var lat  = position.coords.latitude;
            var long = position.coords.longitude;
            console.log(position);
            var uuid = $cordovaDevice.getUUID();
            var record = {advert_id: $scope.advert.id, action:action, device: $rootScope.devicePlatform + ionic.Platform.version(), device_id: uuid, location:lat + ", " + long}
            MainService.saveRecord(record);
          }, function(err) {
            // error
          });        
    }    
    
   
    
})




;
