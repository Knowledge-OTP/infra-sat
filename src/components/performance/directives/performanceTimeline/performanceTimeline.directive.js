(function (angular) {
    'use strict';

    angular.module('znk.infra-sat.performance')
        .directive('performanceTimeline', function performanceTimelineDrv() {
                var directive = {
                    scope: {
                        onTimelineFinish: '&',
                        activeExerciseId: '=?',
                        showInduction: '<?',
                        showTooltips: '<?',
                        results: '<?'
                    },
                    restrict: 'E',
                    templateUrl: 'components/performance/directives/performanceTimeline/performanceTimeline.template.html',
                    controller: 'PerformanceTimelineController',
                    bindToController: true,
                    controllerAs: 'vm'
                };
                return directive;
            }
        );
})(angular);
