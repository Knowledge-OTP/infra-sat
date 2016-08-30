(function (angular) {
    'use strict';

    angular.module('znk.infra-sat.completeExerciseSat', [
        'znk.infra-web-app.completeExercise',
        'znk.infra.znkExercise',
        'znk.infra.contentGetters',
        'znk.infra.estimatedScore',
        'znk.infra-sat.exerciseUtilitySat',
        'znk.infra-sat.examUtility',
        'znk.infra-sat.socialSharingSat',
        'chart.js'
    ]);
})(angular);
