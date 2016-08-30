(function (angular) {
    'use strict';

    angular.module('znk.infra-sat.completeExerciseSat')
        .run(function($timeout, $translatePartialLoader){
            'ngInject';

            $timeout(function(){
                $translatePartialLoader.addPart('completeExerciseSat');
            });
        });
})(angular);
