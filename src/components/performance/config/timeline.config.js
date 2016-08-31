(function (angular) {
    'use strict';

    angular.module('znk.infra-sat.performance')
        .config(function timelineConfig(TimelineSrvProvider) {
            'ngInject';

            TimelineSrvProvider.setColors({
                0: '#AF89D2', 7: '#F9D41B'
            });
        });
})(angular);
