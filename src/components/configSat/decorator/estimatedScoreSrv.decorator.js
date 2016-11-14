(function () {
    'use strict';

    angular.module('znk.infra-sat.configSat')
        .decorator('EstimatedScoreSrv', function ($delegate, ScoringService) {
            'ngInject';

            $delegate.getCompositeScore = function () {    // todo: delete this fn?
                return $delegate.getLatestEstimatedScore().then(function (estimatedScores) {
                    var scoresArr = [];
                    angular.forEach(estimatedScores, function (estimatesScoreForSubject) {
                        scoresArr.push(estimatesScoreForSubject.score || 0);
                    });
                    return ScoringService.getTotalScoreResult(scoresArr);
                });
            };

            return $delegate;
        });
})();
