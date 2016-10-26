angular.module('app.controllers', [])

.controller('TabsCtrl', function($scope, $rootScope, MainService, $cordovaBeacon, AuthService, $ionicPlatform, $timeout, $ionicModal) {
    
    $rootScope.rangedBeacons = [];
    $rootScope.inRangeBeacons = {};  
    
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
            $scope.initBeacons();
        });

        $scope.initBeacons = function(){
            MainService.getBeacons().then(function(data){
                $rootScope.rangedBeacons = data;
                var seenUUID = [];
                for (var index in $rootScope.rangedBeacons){
                    var beacon = $rootScope.rangedBeacons[index];
                    if (seenUUID.indexOf(beacon.uuid) < 0){
                        if (window.cordova){$cordovaBeacon.startRangingBeaconsInRegion($cordovaBeacon.createBeaconRegion("estimote" + index, beacon.uuid));}
                        seenUUID.push(beacon.uuid);
                    }
                }
            });  
        }
        
 
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
        $scope.registerModal.hide();
        $scope.registerModalOpened = false;        
        AuthService.register($scope.registerUser).then(function(){
            $timeout(function(){$rootScope.$broadcast("userRegistered");$rootScope.$broadcast("openTutorial");});
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
    $scope.tempNotifications = [];
    $scope.loadingLinks = false;
    $scope.loadingAdvert = false;
    $scope.timeoutLink = false;
    $scope.loadingBeacons = false;
    $scope.getNotifications = function(){
        if ($scope.notifications.length > 0){
            $scope.tempNotifications = angular.copy($scope.notifications);
            $scope.loadingBeacons = true;
            $timeout(function(){
                $scope.loadingBeacons = false;
            },2000)
        }
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
            //$scope.notifications.push(beacon);             
            if (data.status_code === 401){
                $timeout(function(){$rootScope.$broadcast("openRegister");});
            } 
        })         
    }
    
    $scope.getNotificationsLength = function(){
        if ($scope.loadingBeacons){
            return $scope.tempNotifications.length;
        }
        else{
            return $scope.notifications.length;
        }
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
        if ($scope.timeoutLink && $scope.advert.auto_open){
            $timeout.cancel($scope.timeoutLink);
        }        
        
    });
    // Execute action on remove modal
    $scope.$on('modal.removed', function() {
        screen.lockOrientation('portrait');
        if ($scope.timeoutLink && $scope.advert.auto_open){
            $timeout.cancel($scope.timeoutLink);
        }        
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
        var phone = $scope.advert.phone ? $scope.advert.phone : "Unknown";
        $ionicPopup.confirm({
            title: 'Call',
            template: 'Are you sure you want to call <br>' + phone + '?'
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
            var uuid = $cordovaDevice.getUUID();
            var record = {advert_id: $scope.advert.id, action:action, device: $rootScope.devicePlatform + ionic.Platform.version(), device_id: uuid, location:""}
            MainService.saveRecord(record);
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
    $scope.timeoutLink = false;
    $scope.searchTimeout = false;
    $scope.tapToOpen = false;
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
    $rootScope.$on("userRegistered", function(){
        $timeout(function(){
            $scope.searchTimeout = true;
        },10000);
    })
    
    $timeout(function(){

        if (window.localStorage.external_load !== null && window.localStorage.external_load !=="null" && window.localStorage.external_load !== undefined && window.localStorage.external_load){

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
                        $scope.timeoutLink = $timeout(function(){
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
    },3000); 
    
    
    //open default beacon
    $rootScope.$on("openTutorial", function(){
        $timeout(function(){
            $scope.openAdvertModal();
            $scope.loadingAdvert = true;
            MainService.getAdvertById(1).then(function(data){
                $scope.loadingAdvert = false;
                $scope.advert = data;
                if ($scope.advert.auto_open){
                    if ($scope.advert.auto_open_timeout > 0){
                        $scope.timeoutLink = $timeout(function(){
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
        },1000);
    })
    
    
    $rootScope.$on("closeAdvert",function(){
        $scope.advertModal.hide();
    })
    
    $scope.$on('modal.hidden', function() {
        $timeout(function(){$scope.modalOpen = false;},1000);
        screen.lockOrientation('portrait');
        if ($scope.timeoutLink){
            $timeout.cancel($scope.timeoutLink);
        }
        
    });
    // Execute action on remove modal
    $scope.$on('modal.removed', function() {
        $timeout(function(){$scope.modalOpen = false;},1000);
        screen.lockOrientation('portrait');
        if ($scope.timeoutLink){
            $timeout.cancel($scope.timeoutLink);
        }        
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
                    $scope.timeoutLink = $timeout(function(){
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
          $scope.tapToOpen = true;
          alert("Your device may not support motion gestures. Please tap to grab this ad.");
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
                $scope.tapToOpen = true;
                alert("Your device may not support motion gestures. Please tap to grab this ad.");
            },
            function(result){
                var x = result.x;
                var y = result.y;
                var z = result.z;
                var isMoving = x < -2 || x > 2;
                if ($scope.acceleration.y > 4 && isMoving && Object.keys($rootScope.inRangeBeacons).length > 0 && !$scope.modalOpen && $state.current.name === "tab.drag"){

                    var beacon = {}; var proximity = false; 
                    console.log($rootScope.inRangeBeacons);
                    for (var index in $rootScope.inRangeBeacons){
                        //check if beacon is in the ranged beacons
                        if ($scope.isRangedBeacon($rootScope.inRangeBeacons[index])){
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
                    }
                    console.log(beacon);
                    $scope.currentBeacon = beacon;
                    $scope.getAdvert(beacon);
                    $scope.openAdvertModal();              
                } 
                $scope.speed = result;
            
            })
        
        
    },false);
    
    $scope.isRangedBeacon = function(beacon){
        console.log(beacon);
        console.log($rootScope.rangedBeacons);
        for (var index in $rootScope.rangedBeacons){
            if ($rootScope.rangedBeacons[index].uuid === beacon.uuid && $rootScope.rangedBeacons[index].major === beacon.major && $rootScope.rangedBeacons[index].minor === beacon.minor){
                return true;break;
            }
        }
        return false;
    }
    
    $scope.tapOpenAdvert = function(){
        if (!$scope.tapToOpen){return;}
        var beacon = {}; var proximity = false; 
        for (var index in $rootScope.inRangeBeacons){
            //check if beacon is in the ranged beacons
            if ($scope.isRangedBeacon($rootScope.inRangeBeacons[index])){
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
        }
        $scope.currentBeacon = beacon;
        $scope.getAdvert(beacon);
        $scope.openAdvertModal();           
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
        var phone = $scope.advert.phone ? $scope.advert.phone : "Unknown";
        $ionicPopup.confirm({
            title: 'Call',
            template: 'Are you sure you want to call <br>' + phone + '?'
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
          });        
    }
    
    
    
})

.controller('HistoryCtrl', function($scope, MainService, AuthService, $ionicModal, $cordovaSocialSharing, $ionicPopup, $cordovaGeolocation, $cordovaDevice, $rootScope, $timeout) {
    $scope.loading = false;
    $scope.records = [];
    $scope.recordAdvertIds = [];
    $scope.records = [];    
    $scope.loadingAdvert = false;
    $scope.timeoutLink = false;
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
        screen.unlockOrientation();
        $scope.advertModal.show();
    }
    
    $rootScope.$on("closeAdvert",function(){
        $scope.advertModal.hide();
    })
    
    $scope.$on('modal.hidden', function() {
        screen.lockOrientation('portrait');
        if ($scope.timeoutLink && $scope.advert.auto_open){
            $timeout.cancel($scope.timeoutLink);
        }        
        
    });
    // Execute action on remove modal
    $scope.$on('modal.removed', function() {
        screen.lockOrientation('portrait');
        if ($scope.timeoutLink && $scope.advert.auto_open){
            $timeout.cancel($scope.timeoutLink);
        }        
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
        var phone = $scope.advert.phone ? $scope.advert.phone : "Unknown";
        $ionicPopup.confirm({
            title: 'Call',
            template: 'Are you sure you want to call <br>' + phone + '?'
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
            var uuid = $cordovaDevice.getUUID();
            var record = {advert_id: $scope.advert.id, action:action, device: $rootScope.devicePlatform + ionic.Platform.version(), device_id: uuid, location:""}
            MainService.saveRecord(record);
          });        
    }    
    
   
    
})




;
