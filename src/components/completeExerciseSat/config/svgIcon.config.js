(function () {
    'use strict';

    angular.module('znk.infra-sat.completeExerciseSat')
        .config(function (SvgIconSrvProvider) {
            'ngInject';

            var svgMap = {
                'correct-icon': 'components/completeExerciseSat/svg/correct-icon.svg',
                'wrong-icon': 'components/completeExerciseSat/svg/wrong-icon.svg'
            };
            SvgIconSrvProvider.registerSvgSources(svgMap);
        });
})();

