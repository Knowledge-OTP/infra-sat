(function (angular) {
    'use strict';
    
    angular.module('znk.infra-sat.completeExerciseSat')
        .config(function (ExerciseCycleSrvProvider) {
            'ngInject';
            ExerciseCycleSrvProvider.setInvokeFunctions({
                afterBroadcastFinishExercise: function (completeExerciseSatSrv) {
                    'ngInject';//jshint ignore:line
                    return function (data) {
                        return completeExerciseSatSrv.afterBroadcastFinishExercise(data);
                    };
                }
            });
        });
})(angular);