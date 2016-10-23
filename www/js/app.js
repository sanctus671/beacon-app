// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('app', ['ionic', 'app.controllers', 'app.services', 'app.config', 'ngCordova', 'deviceGyroscope'])

.run(function($ionicPlatform, $rootScope, AuthService, $timeout) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);

    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
    
    if(navigator && navigator.splashscreen) {$timeout(function(){navigator.splashscreen.hide();})}
    
    $rootScope.devicePlatform = ionic.Platform.platform();

    AuthService.userIsLoggedIn().then(function(response){
        $timeout(function(){$rootScope.$broadcast("userRegistered");$rootScope.$broadcast("openTutorial");});

    },function(response){
        //reregister user
        $timeout(function(){$rootScope.$broadcast("openRegister");});
    });    
    
    
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.locationManager) {
        cordova.plugins.locationManager.isBluetoothEnabled()
            .then(function(isEnabled){
                if (!isEnabled) {
                    cordova.plugins.locationManager.enableBluetooth();        
                }
            })
            .fail(function(e) {  })
            .done();   
    }
    
    if (window.cordova && window.cordova.plugins && cordova.plugins.BluetoothStatus){
        cordova.plugins.BluetoothStatus.initPlugin();
        if (!cordova.plugins.BluetoothStatus.hasBTLE){
            alert("Your device does not support this app. Please use another device.");
        }
    }

  
    $ionicPlatform.on("resume", function(){ 
        $rootScope.keepAdvertOpen = false;        
        //window.plugin.notification.local.cancelAll();
        AuthService.userIsLoggedIn().then(function(){
            $timeout(function(){$rootScope.$broadcast("userRegistered");});
            
        },function(){
            //reregister user
            $timeout(function(){$rootScope.$broadcast("openRegister");});
        });
    });    
    
    $ionicPlatform.on("pause", function(){ 
        if (!$rootScope.keepAdvertOpen){$rootScope.$broadcast("closeAdvert");}
    });    
    
    
  });
  
    $rootScope.$on("$stateChangeStart", function(event, toState, toParams, fromState, fromParams){ // UI Router Authentication Check
      if (toState.data.authenticate){
          AuthService.userIsLoggedIn().then(function(response){
              //$timeout(function(){$rootScope.$broadcast("userRegistered");});
          },function(){
              //reregister user
            $timeout(function(){$rootScope.$broadcast("openRegister");});
          });
      }

    });  

    $rootScope.$on("$stateChangeSuccess", function(event, toState, toParams, fromState, fromParams){ // UI Router Authentication Check
        
       

    });    
  
  
  
})

.config(function($stateProvider, $urlRouterProvider, $ionicConfigProvider) {

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  
  $ionicConfigProvider.tabs.position('bottom');
  $ionicConfigProvider.tabs.style('standard')
  $stateProvider

  // setup an abstract state for the tabs directive
    .state('tab', {
    url: '/tab',
    abstract: true,
    templateUrl: 'templates/tabs.html',
    controller: 'TabsCtrl'
  })

  // Each tab has its own nav history stack:

  .state('tab.notifications', {
    url: '/notifications',
    views: {
      'tab-notifications': {
        templateUrl: 'templates/tab-notifications.html',
        controller: 'NotificationsCtrl'
      }
    },
    data: {
      authenticate: true
    }    
  })



  .state('tab.drag', {
    url: '/drag',
    views: {
      'tab-drag': {
        templateUrl: 'templates/tab-drag.html',
        controller: 'DragCtrl'
      }
    },
    data: {
      authenticate: true
    } 
  })
  
  .state('tab.history', {
    url: '/history',
    views: {
      'tab-history': {
        templateUrl: 'templates/tab-history.html',
        controller: 'HistoryCtrl'
      }
    },
    data: {
      authenticate: true
    } 
    })
  
    
    
    
    ;
  
  

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/tab/drag');

});



function handleOpenURL(url) {
  setTimeout(function() {
    window.localStorage.external_load = url;
  }, 0);
}