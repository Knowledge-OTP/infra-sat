(function () {
    'use strict';

    angular.module('znk.infra-sat.configSat')
        .decorator('SubjectEnum', function ($delegate) {
            'ngInject';

            var relevantSubjects = ['MATH', 'VERBAL', 'ESSAY'];
            angular.forEach($delegate, function (value, key) {
                if (relevantSubjects.indexOf(key) === -1) {
                    delete $delegate[key];
                }
            });
            return $delegate;
        });
})();
