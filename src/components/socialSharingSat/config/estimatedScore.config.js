(function (angular) {
    'use strict';

    angular.module('znk.infra-sat.socialSharingSat')
        .config(function estimatedScoreConfig(EstimatedScoreSrvProvider, SubjectEnumConst,EstimatedScoreEventsHandlerSrvProvider, exerciseTypeConst, CategoryServiceProvider) {
            'ngInject';

            var categoryService = CategoryServiceProvider.$get();

            var subjectsRawScoreEdges = {};
            subjectsRawScoreEdges[SubjectEnumConst.VERBAL] = {
                min: 0,
                max: 80
            };
            subjectsRawScoreEdges [SubjectEnumConst.MATH] = {
                min: 0,
                max: 58
            };

            EstimatedScoreSrvProvider.setSubjectsRawScoreEdges(subjectsRawScoreEdges);

            EstimatedScoreSrvProvider.setMinMaxDiagnosticScore(-Infinity, Infinity);

            function rawScoreToScoreFnGetter(ScoringService) {
                'ngInject';//jshint ignore:line

                return function (subjectId, rawScore) {
                    return ScoringService.rawScoreToScore(subjectId, rawScore);
                };
            }

            EstimatedScoreSrvProvider.setRawScoreToRealScoreFn(rawScoreToScoreFnGetter);

            var diagnosticScoringMap = {
                1: [55, 55, 45, 45],
                2: [65, 65, 50, 50],
                3: [75, 75, 55, 55],
                4: [85, 85, 65, 65],
                5: [95, 95, 75, 75]
            };
            EstimatedScoreEventsHandlerSrvProvider.setDiagnosticScoring(diagnosticScoringMap);

            var defaultRawPointsForExercise = [1, 0, 0, 0];
            var exerciseRawPoints = [1, 1, 0, 0];
            var sectionRawPoints = [1, 0, 0, 0];
            EstimatedScoreEventsHandlerSrvProvider.setExerciseRawPoints(exerciseTypeConst.SECTION, sectionRawPoints);
            EstimatedScoreEventsHandlerSrvProvider.setExerciseRawPoints(exerciseTypeConst.TUTORIAL, exerciseRawPoints);
            EstimatedScoreEventsHandlerSrvProvider.setExerciseRawPoints(exerciseTypeConst.PRACTICE, exerciseRawPoints);

            function eventProcessControl(SubjectEnum) {
                'ngInject';//jshint ignore:line

                return function (exerciseType, exercise) {
                    var exerciseSubjedctId = categoryService.getCategoryLevel1ParentSync([exercise.categoryId, exercise.categoryId2]);
                    return exerciseSubjedctId !== SubjectEnum.ESSAY.enum;
                };
            }

            EstimatedScoreEventsHandlerSrvProvider.setEventProcessControl(eventProcessControl);
        });
})(angular);
