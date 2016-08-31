(function (angular) {
    'use strict';

    angular.module('znk.infra-sat.performance')
        .run(function($timeout, $translatePartialLoader){
            'ngInject';

            $timeout(function(){
                $translatePartialLoader.addPart('performance');
            });
        });
})(angular);
