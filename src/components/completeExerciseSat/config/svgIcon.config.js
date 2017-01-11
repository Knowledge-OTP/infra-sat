(function () {
    'use strict';

    angular.module('znk.infra-sat.completeExerciseSat')
        .config(function (SvgIconSrvProvider) {
            'ngInject';

            var svgMap = {
                'complete-exercise-correct-icon': 'components/completeExerciseSat/svg/correct-icon.svg',
                'complete-exercise-wrong-icon': 'components/completeExerciseSat/svg/wrong-icon.svg',
                'znk-app-name-logo': 'components/configSat/svg/znk-app-name-logo.svg'
            };
            SvgIconSrvProvider.registerSvgSources(svgMap);
        });
})();

