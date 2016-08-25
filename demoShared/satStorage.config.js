(function (angular) {
    'use strict';

    angular.module('demo').run(function () {

        var itemsToSet = {
            znkAuthToken:   'TykqAPXV4zlTTG0v6UuOt4OF3HssDykhJd90dAIc',
            znkData: 'https://sat-dev.firebaseio.com/',
            znkStudentPath: '/sat_app'
        };

        angular.forEach(itemsToSet, function(val, name){
            localStorage.setItem(name, val);
        });
    });
})(angular);
