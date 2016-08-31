(function (angular) {
    'use strict';

    angular.module('znk.infra-sat.performance')
        .directive('znkProgressBar', function znkProgressBarDirective() {
                'ngInject';

                var directive = {
                    templateUrl: 'components/performance/directives/znkProgressBar/znkProgressBar.template.html',
                    scope: {
                        progressWidth: '@',
                        progressValue: '@',
                        showProgressValue: '@',
                        showProgressBubble: '&'
                    }
                };

                return directive;
            }
        );
})(angular);
