(function (angular) {
    'use strict';

    angular.module('znk.infra-sat.completeExerciseSat')
        .service('completeExerciseSatSrv', function (/* $q, $log, ExerciseTypeEnum, ExerciseResultSrv, ExamSrv */) {
            'ngInject';

            // function saveSectionScoring(sectionScoringNum, subjectId) {
            //     if (!exerciseData.examResult.scores) {
            //         exerciseData.examResult.scores = {};
            //     }
            //     if (!exerciseData.examResult.scores.sectionsScore) {
            //         exerciseData.examResult.scores.sectionsScore = {};
            //     }
            //     exerciseData.examResult.scores.sectionsScore[subjectId] = sectionScoringNum;
            //     saveTotalScore();
            // }

            // function saveTotalScore() {
            //     var sectionsScore = exerciseData.examResult.scores.sectionsScore;
            //     if (sectionsScore[SubjectEnum.MATH['enum']] && sectionsScore[SubjectEnum.VERBAL['enum']]) {
            //         exerciseData.examResult.scores.totalScore = sectionsScore[SubjectEnum.MATH['enum']] + sectionsScore[SubjectEnum.VERBAL['enum']];
            //     }
            // }

            // function saveTestScoring(testScoringNum, categoryId) {
            //     if (!exerciseData.examResult.scores) {
            //         exerciseData.examResult.scores = {};
            //     }
            //     if (!exerciseData.examResult.scores.testsScore) {
            //         exerciseData.examResult.scores.testsScore = {};
            //     }
            //     exerciseData.examResult.scores.testsScore[categoryId] = testScoringNum;
            // }

            // function prepareDataForExerciseFinish() {
            //     if (!isSection || exercise.subjectId === SubjectEnum.ESSAY['enum']) {
            //         return $q.when({});
            //     }
            //     var examData = exerciseData.examData;
            //     var examResult = exerciseData.examResult;
            //     var mergedTestScoresIfCompletedProm = this.mergedTestScoresIfCompleted(examData, examResult, exercise, exerciseResult);

            //     return mergedTestScoresIfCompletedProm.then(function (mergeSectionData) {
            //         var proms = { newExerciseData: mergeSectionData };
            //         var scoringSectionProm;
            //         var scoringTestProm;
            //         var questionResults;
            //         if (mergeSectionData) {
            //             questionResults = mergeSectionData.resultsData.questionResults;
            //             scoringSectionProm = ScoringService.getSectionScoreResult(questionResults, examData.typeId, exercise.subjectId);
            //             proms.sectionScoring = scoringSectionProm;
            //             // if math - testScoring is calculated per section and not per test
            //             if (exercise.subjectId === SubjectEnum.MATH['enum']) {
            //                 scoringTestProm = ScoringService.getTestScoreResult(questionResults, examData.typeId, exercise.categoryId);
            //                 proms.testScoring = scoringTestProm;
            //             }
            //         }
            //         // if not math - testScoring is calculated per test
            //         if (exercise.subjectId !== SubjectEnum.MATH['enum']) {
            //             scoringTestProm = ScoringService.getTestScoreResult(exerciseResult.questionResults, examData.typeId, exercise.categoryId);
            //             proms.testScoring = scoringTestProm;
            //         }
            //         return $q.all(proms);
            //     });
            // }

            // this.mergedTestScoresIfCompleted = function (exam, examResult, questionsData, resultsData) {
            //     if (!exam || !questionsData || !resultsData || !examResult) {
            //         var errMsg = 'completeExerciseSatSrv combinedSections:' +
            //             'one or more of the arguments is missing!';
            //         $log.error(errMsg, 'arguments:', arguments);
            //         return $q.reject(errMsg);
            //     }
            //     resultsData = angular.copy(resultsData);
            //     questionsData = angular.copy(questionsData);
            //     var examId = exam.id;
            //     var subjectId = questionsData.subjectId;
            //     var currentSectionId = questionsData.id;
            //     var sectionResults = examResult.sectionResults;
            //     var sectionProms = [];
            //     var getOtherSections = exam.sections.filter(function (section) {
            //         return section.subjectId === subjectId && currentSectionId !== section.id;
            //     });
            //     angular.forEach(getOtherSections, function (sectionBySubject) {
            //         var sectionKey = sectionResults[sectionBySubject.id];
            //         if (sectionKey) {
            //             var exerciseResultProm = ExerciseResultSrv.getExerciseResult(ExerciseTypeEnum.SECTION.enum, sectionBySubject.id, examId, null, true);
            //             var examSectionProm = ExamSrv.getExamSection(sectionBySubject.id);
            //             sectionProms.push(exerciseResultProm);
            //             sectionProms.push(examSectionProm);
            //         }
            //     });
            //     if (sectionProms.length === 0) {
            //         return $q.when(false);
            //     }
            //     return $q.all(sectionProms).then(function (results) {
            //         var lengthResults = 0;
            //         angular.forEach(results, function (result, index) {
            //             if (result.isComplete) {
            //                 questionsData.questions = questionsData.questions.concat(results[index + 1].questions);
            //                 resultsData.questionResults = resultsData.questionResults.concat(result.questionResults);
            //                 lengthResults += 2;
            //             }
            //         });
            //         if (results.length !== lengthResults) {
            //             return $q.when(false);
            //         }
            //         return {
            //             questionsData: questionsData,
            //             resultsData: resultsData
            //         };
            //     });
            // };

            this.afterBroadcastFinishExercise = function (data) {
                console.log(data);
                // var exam = isSection ? exerciseData.examData : undefined;
                // prepareDataForExerciseFinish().then(function (result) {
                //     if (exam) {
                //         if (result.sectionScoring) {
                //             saveSectionScoring(result.sectionScoring.sectionScore, exercise.subjectId);
                //         }
                //         if (result.testScoring) {
                //             saveTestScoring(result.testScoring.testScore, exercise.categoryId);
                //         }
                //         exerciseData.examResult.$save();
                //     }
                // });
            };
        });
})(angular);
