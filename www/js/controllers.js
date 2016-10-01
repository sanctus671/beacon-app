angular.module('app.controllers', [])

.controller('TabsCtrl', function($scope, $rootScope, MainService, $cordovaBeacon, AuthService, $ionicPlatform, $timeout, $ionicModal) {
    
    $rootScope.rangedBeacons = [];
    $rootScope.inRangeBeacons = {
        "b9407f30-f5f8-466e-aff9-25556b57fe6d" : {uuid:"b9407f30-f5f8-466e-aff9-25556b57fe6d", major:"51316", minor:"26815"}
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
        
        if (window.cordova){
            $cordovaBeacon.requestWhenInUseAuthorization();
            screen.lockOrientation('portrait');
        }
        
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
            MainService.getBeacons().then(function(data){
                $rootScope.rangedBeacons = data;
                for (var index in $rootScope.rangedBeacons){
                    var beacon = $rootScope.rangedBeacons[index];
                    if (window.cordova){$cordovaBeacon.startRangingBeaconsInRegion($cordovaBeacon.createBeaconRegion("estimote" + index, beacon.uuid, beacon.major, beacon.minor));}
                }
            });
        });
 
    });
    
    $scope.openFacebook = function(){
        window.open('https://www.facebook.com/grabadnz/', "_system");
    }
    
    $scope.registerUser = {name:"",email:"",phone:""};
    $rootScope.registerModalOpened = false;
    $ionicModal.fromTemplateUrl('templates/modals/register.html', {
        scope: $scope,
        animation: 'fade-in-scale'
    }).then(function(modal) {
        $scope.registerModal = modal;
    });    
    
    $scope.openRegisterModal = function(){
        if (!$rootScope.registerModalOpened){
            $rootScope.registerModalOpened = true;
            $scope.registerModal.show();
        }
    }  
    
    $scope.doRegister = function(){
        $scope.error = "";
        if (!$scope.registerUser.name || !$scope.registerUser.email || !$scope.registerUser.phone){
            $scope.error = "Please enter all fields";
            return;
        }
        AuthService.register($scope.registerUser).then(function(){
            $scope.registerModal.hide();
            $scope.registerModalOpened = false;
            $timeout(function(){$rootScope.$broadcast("userRegistered");});
        },function(data){
            $scope.error = "An error occured. Please try again.";
        });        
    }
    
    $rootScope.$on("openRegister", function(){
        $scope.openRegisterModal();
    })
    
})




.controller('NotificationsCtrl', function($scope, MainService, AuthService, $ionicModal, $cordovaSocialSharing, $ionicPopup, $cordovaGeolocation, $cordovaDevice, $rootScope, $timeout) {
    $scope.notifications = [];
    $scope.loadingLinks = false;
    $scope.loadingAdvert = false;
    $scope.getNotifications = function(){
        $scope.notifications = [];
        for (var index in $rootScope.inRangeBeacons){
            $scope.addNotifiction($rootScope.inRangeBeacons[index]);    
        }
        $scope.$broadcast('scroll.refreshComplete');
    }
    
    $scope.addNotifiction = function(beacon){
        MainService.getAdvert(beacon).then(function(data){
            beacon.advert = data;  
            $scope.notifications.push(beacon);                         
        },function(data){
            beacon.advert = {};  
            $scope.notifications.push(beacon);             
            if (data.status_code === 401){
                $timeout(function(){$rootScope.$broadcast("openRegister");});
            } 
        })         
    }
    
    $scope.getNotificationsLength = function(){
        return $scope.notifications.length;
    }
    

    

    $scope.$on("$ionicView.afterEnter", function(event, data){
       $scope.getNotifications();
    });    
    
    
    
    $scope.advert = {};

    $ionicModal.fromTemplateUrl('templates/modals/advert.html', {
        scope: $scope,
        animation: 'fade-in-scale'
    }).then(function(modal) {
        $scope.advertModal = modal;
    });    
    
    $scope.openAdvertModal = function(){
        screen.unlockOrientation();
        $scope.advertModal.show();
    }
    
    $rootScope.$on("closeAdvert",function(){
        $scope.advertModal.hide();
    })
    
    $scope.$on('modal.hidden', function() {
        screen.lockOrientation('portrait');
        
    });
    // Execute action on remove modal
    $scope.$on('modal.removed', function() {
        screen.lockOrientation('portrait');
    });     

    
    $scope.getAdvert = function(index){
        $scope.advert = {};    
        $scope.advert = $scope.notifications[index].advert;
        if ($scope.advert.auto_open){
            if ($scope.advert.auto_open_timeout > 0){
                $timeout(function(){
                    $scope.doAction('link');
                },$scope.advert.auto_open_timeout*1000);                    
            }
            else{
                $scope.doAction('link');
            }
        }        
        if ($scope.advert.link_timeout > 0){
            $scope.loadingLinks = true;
            $timeout(function(){
                $scope.loadingLinks = false;
            },$scope.advert.link_timeout*1000);
        }
        else{
            $scope.loadingLinks = false;
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
            $rootScope.keepAdvertOpen = true;
            window.open('tel:' + $scope.advert.phone, '_system')
        }
        else if (action === 'link'){            
            $rootScope.keepAdvertOpen = true;
            window.open($scope.advert.link, "_system");
            
        }
        else if (action === 'location'){
            $rootScope.keepAdvertOpen = true;
            window.open("https://www.google.com/maps/place/" + $scope.advert.location, "_system");
        }
        else if (action === 'info'){
            $scope.openInfoPopup();
        }
        else if (action === 'share'){
            $rootScope.keepAdvertOpen = true;
            $cordovaSocialSharing
                .share($scope.advert.name, $scope.advert.name, null, "http://gaapp.appsy.nz/link/" + $scope.advert.id) // Share via native share sheet
             
        }
    }
    
    $scope.openLocation = function(location){
        if (!location){return;}
        window.open("https://www.google.com/maps/place/" + location, "_system");
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
            var uuid = $cordovaDevice.getUUID();
            var record = {advert_id: $scope.advert.id, action:action, device: $rootScope.devicePlatform + ionic.Platform.version(), device_id: uuid, location:lat + ", " + long}
            MainService.saveRecord(record);
          }, function(err) {
            // error
          });        
    }    
    
       
    
    
    
    
})



.controller('DragCtrl', function($scope, MainService, AuthService, $rootScope, $cordovaBeacon, $deviceGyroscope, $ionicPopup, $cordovaSocialSharing, $ionicModal, $cordovaDeviceMotion, $cordovaGeolocation, $cordovaDevice, $state, $timeout) {

    $scope.modalOpen = false;
    $scope.advert = {};
    $scope.stage = 2;
    $scope.loading = true;
    $scope.pullCount = 0;
    $scope.loadingAdvert = false;
    $scope.currentBeacon = {uuid:0,major:0,minor:0};
    $ionicModal.fromTemplateUrl('templates/modals/advert.html', {
        scope: $scope,
        animation: 'slide-in-down'
    }).then(function(modal) {
        $scope.advertModal = modal;
    });    

    
    $scope.openAdvertModal = function(){
        $scope.modalOpen = true;
        
        screen.unlockOrientation();
        $scope.advertModal.show();
    }
    
    $timeout(function(){
        if (window.localStorage.external_load !== null && window.localStorage.external_load !=="null"){
            var url = window.localStorage.external_load;
            if (!url){return;}
            var advertId = url.replace(/\//g, "").split(":")[1];

            $scope.openAdvertModal();
            $scope.advert = {};
            $scope.loadingAdvert = true;
            MainService.getAdvertById(advertId).then(function(data){
                $scope.loadingAdvert = false;
                $scope.advert = data;
                if ($scope.advert.auto_open){
                    if ($scope.advert.auto_open_timeout > 0){
                        $timeout(function(){
                            $scope.doAction('link');
                        },$scope.advert.auto_open_timeout*1000);                    
                    }
                    else{
                        $scope.doAction('link');
                    }
                }                
                if ($scope.advert.link_timeout > 0){
                    $scope.loadingLinks = true;
                    $timeout(function(){
                        $scope.loadingLinks = false;
                    },$scope.advert.link_timeout*1000);
                }
                else{
                    $scope.loadingLinks = false;
                }  
            },function(data){
                $scope.loadingAdvert = false;
                $timeout(function(){$scope.advertModal.hide()},2000);
                if (data.status_code === 401){
                    $timeout(function(){$rootScope.$broadcast("openRegister");});
                } 
            })              
            window.localStorage.external_load = null;
        }
    },1000);    
    
    
    $rootScope.$on("closeAdvert",function(){
        $scope.advertModal.hide();
    })
    
    $scope.$on('modal.hidden', function() {
        $scope.modalOpen = false;
        screen.lockOrientation('portrait');
        
    });
    // Execute action on remove modal
    $scope.$on('modal.removed', function() {
        $scope.modalOpen = false;
        screen.lockOrientation('portrait');
    });    
    
    $scope.getBeaconCount = function(){
        return Object.keys($rootScope.inRangeBeacons).length;
    }

    
    $scope.getAdvert = function(beacon){
        $scope.modalOpen = true;
        $scope.advert = {};
        $scope.loadingAdvert = true;
        MainService.getAdvert(beacon).then(function(data){
            $scope.loadingAdvert = false;
            $scope.advert = data;
            if ($scope.advert.auto_open){
                if ($scope.advert.auto_open_timeout > 0){
                    $timeout(function(){
                        $scope.doAction('link');
                    },$scope.advert.auto_open_timeout*1000);                    
                }
                else{
                    $scope.doAction('link');
                }
            }
            if ($scope.advert.link_timeout > 0){
                $scope.loadingLinks = true;
                $timeout(function(){
                    $scope.loadingLinks = false;
                },$scope.advert.link_timeout*1000);
            }
            else{
                $scope.loadingLinks = false;
            }            
            
        },function(data){
            $scope.loadingAdvert = false;
            $timeout(function(){$scope.advertModal.hide()},2000);
            if (data.status_code === 401){
                $timeout(function(){$rootScope.$broadcast("openRegister");});
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
            },
            function(result){
                var x = result.x;
                var y = result.y;
                var z = result.z;
                var isMoving = x > 2;
                if ($scope.acceleration.y > 4 && isMoving && Object.keys($rootScope.inRangeBeacons).length > 0 && !$scope.modalOpen && $state.current.name === "tab.drag"){

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
                    $scope.currentBeacon = beacon;
                    $scope.getAdvert(beacon);
                    $scope.openAdvertModal();              
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
            $rootScope.keepAdvertOpen = true;
            window.open('tel:' + $scope.advert.phone, '_system')
        }
        else if (action === 'link'){
            $rootScope.keepAdvertOpen = true;
            window.open($scope.advert.link, "_system");           
        }
        else if (action === 'location'){
            $rootScope.keepAdvertOpen = true;
            window.open("https://www.google.com/maps/place/" + $scope.advert.location, "_system");
        }
        else if (action === 'info'){
            $scope.openInfoPopup();
        }
        else if (action === 'share'){
            $rootScope.keepAdvertOpen = true;
            $cordovaSocialSharing
                .share($scope.advert.name, $scope.advert.name, null, "http://gaapp.appsy.nz/link/" + $scope.advert.id) // Share via native share sheet
             
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
            var uuid = $cordovaDevice.getUUID();
            var beaconID = "";
            for (var index in $rootScope.rangedBeacons){
                if ($rootScope.rangedBeacons[index].uuid === $scope.currentBeacon.uuid && $rootScope.rangedBeacons[index].major === $scope.currentBeacon.major && $rootScope.rangedBeacons[index].minor === $scope.currentBeacon.minor){
                    beaconID = $rootScope.rangedBeacons[index].id;
                    break;
                }
            }
            var record = {advert_id: $scope.advert.id,beacon_id:beaconID, action:action, device: $rootScope.devicePlatform + ionic.Platform.version(), device_id: uuid, location:lat + ", " + long}
            MainService.saveRecord(record);
          }, function(err) {
            // error
          });        
    }
    
    
    
})

.controller('HistoryCtrl', function($scope, MainService, AuthService, $ionicModal, $cordovaSocialSharing, $ionicPopup, $cordovaGeolocation, $cordovaDevice, $rootScope, $timeout) {
    $scope.loading = false;
    $scope.records = [];
    $scope.recordAdvertIds = [];
    $scope.records = [];    
    $scope.loadingAdvert = false;
    $scope.doRefresh = function(){  
        $scope.loading = true;
        MainService.getRecords().then(function(data){
            $scope.loading = false;
            $scope.$broadcast('scroll.refreshComplete');
            $scope.recordAdvertIds = [];
            $scope.records = data.filter(function(value){
                if ($scope.recordAdvertIds.indexOf(value.advert_id) < 0){
                    $scope.recordAdvertIds.push(value.advert_id);
                    return true;
                }
                return false;
            });
        },function(data){
            $scope.$broadcast('scroll.refreshComplete');
            if (data.status_code === 401){
                $timeout(function(){$rootScope.$broadcast("openRegister");});
            } 
        })
    }

    $scope.$on("$ionicView.afterEnter", function(event, data){
       $scope.doRefresh();
    });    
    
    
    
    $scope.advert = {};

    $ionicModal.fromTemplateUrl('templates/modals/advert.html', {
        scope: $scope,
        animation: 'fade-in-scale'
    }).then(function(modal) {
        $scope.advertModal = modal;
    });    
    
    $scope.openAdvertModal = function(){
        //screen.unlockOrientation();
        $scope.advertModal.show();
    }
    
    $rootScope.$on("closeAdvert",function(){
        $scope.advertModal.hide();
    })
    
    $scope.$on('modal.hidden', function() {
        screen.lockOrientation('portrait');
        
    });
    // Execute action on remove modal
    $scope.$on('modal.removed', function() {
        screen.lockOrientation('portrait');
    });     

    
    $scope.getAdvert = function(recordId){
        $scope.advert = {};    
        for (var index in $scope.records){
            if ($scope.records[index].id === recordId){
                $scope.advert = $scope.records[index].advert;
                if ($scope.advert.auto_open){
                    if ($scope.advert.auto_open_timeout > 0){
                        $timeout(function(){
                            $scope.doAction('link');
                        },$scope.advert.auto_open_timeout*1000);                    
                    }
                    else{
                        $scope.doAction('link');
                    }
                }                
                if ($scope.advert && $scope.advert.link_timeout > 0){
                    $scope.loadingLinks = true;
                    $timeout(function(){
                        $scope.loadingLinks = false;
                    },$scope.advert.link_timeout*1000);
                }
                else{
                    $scope.loadingLinks = false;
                }                
            }
        } 
        if ($scope.advert && $scope.advert.id){
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
            $rootScope.keepAdvertOpen = true;
            window.open('tel:' + $scope.advert.phone, '_system')
        }
        else if (action === 'link'){            
            $rootScope.keepAdvertOpen = true;
            window.open($scope.advert.link, "_system");
            
        }
        else if (action === 'location'){
            $rootScope.keepAdvertOpen = true;
            window.open("https://www.google.com/maps/place/" + $scope.advert.location, "_system");
        }
        else if (action === 'info'){
            $scope.openInfoPopup();
        }
        else if (action === 'share'){
            $rootScope.keepAdvertOpen = true;
            $cordovaSocialSharing
                .share($scope.advert.name, $scope.advert.name, null, "http://gaapp.appsy.nz/link/" + $scope.advert.id) // Share via native share sheet
             
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
            var uuid = $cordovaDevice.getUUID();
            var record = {advert_id: $scope.advert.id, action:action, device: $rootScope.devicePlatform + ionic.Platform.version(), device_id: uuid, location:lat + ", " + long}
            MainService.saveRecord(record);
          }, function(err) {
            // error
          });        
    }    
    
   
    
})




;
