(function (angular) {
    'use strict';

    angular.module('znk.infra-sat.completeExerciseSat')
        .service('completeExerciseSatSrv', function ($q, $log, ExerciseTypeEnum, SubjectEnum, ExerciseResultSrv, ExamSrv, ScoringService, ExerciseParentEnum) {
            'ngInject';

            var self = this;

            function saveSectionScoring(examResult, sectionScoringNum, subjectId) {
                if (!examResult.scores) {
                    examResult.scores = {};
                }
                if (!examResult.scores.sectionsScore) {
                    examResult.scores.sectionsScore = {};
                }
                examResult.scores.sectionsScore[subjectId] = sectionScoringNum;
                saveTotalScore(examResult);
            }

            function saveTotalScore(examResult) {
                var sectionsScore = examResult.scores.sectionsScore;
                if (sectionsScore[SubjectEnum.MATH.enum] && sectionsScore[SubjectEnum.VERBAL.enum]) {
                    examResult.scores.totalScore = sectionsScore[SubjectEnum.MATH.enum] + sectionsScore[SubjectEnum.VERBAL.enum];
                }
            }

            function saveTestScoring(examResult, testScoringNum, categoryId) {
                if (!examResult.scores) {
                    examResult.scores = {};
                }
                if (!examResult.scores.testsScore) {
                    examResult.scores.testsScore = {};
                }
                examResult.scores.testsScore[categoryId] = testScoringNum;
            }

            function prepareDataForExerciseFinish(data) {
                var examId, examData;
                if (data.exerciseParentTypeId === ExerciseParentEnum.MODULE.enum) {  //if it's a module exam there is no exerciseParentContent
                    examData = data.moduleExamData;                                  // so take the exam data from data.moduleExamData
                    examId = examData.id
                } else {
                    examId = data.exerciseParentContent.id;
                    examData = data.exerciseParentContent;
                }
                return ExerciseResultSrv.getExamResult(examId).then(function (examResult) {
                    var exercise = data.exerciseContent;
                    var exerciseResult = data.exerciseResult;

                    var mergedTestScoresIfCompletedProm = self.mergedTestScoresIfCompleted(examData, examResult, exercise, exerciseResult);

                    return mergedTestScoresIfCompletedProm.then(function (mergeSectionData) {
                        var proms = {
                            newExerciseData: mergeSectionData,
                            exercise: exercise,
                            examResult: examResult
                        };
                        var scoringSectionProm;
                        var scoringTestProm;
                        var questionResults;
                        if (mergeSectionData) {
                            questionResults = mergeSectionData.resultsData.questionResults;
                            scoringSectionProm = ScoringService.getSectionScoreResult(questionResults, examData.typeId, exercise.subjectId);
                            proms.sectionScoring = scoringSectionProm;
                            // if math - testScoring is calculated per section and not per test
                            if (exercise.subjectId === SubjectEnum.MATH.enum) {
                                scoringTestProm = ScoringService.getTestScoreResult(questionResults, examData.typeId, exercise.categoryId);
                                proms.testScoring = scoringTestProm;
                            }
                        }
                        // if not math - testScoring is calculated per test
                        if (exercise.subjectId !== SubjectEnum.MATH.enum) {
                            scoringTestProm = ScoringService.getTestScoreResult(exerciseResult.questionResults, examData.typeId, exercise.categoryId);
                            proms.testScoring = scoringTestProm;
                        }
                        return $q.all(proms);
                    });
                });
            }

            this.mergedTestScoresIfCompleted = function (exam, examResult, questionsData, resultsData) {
                if (!exam || !questionsData || !resultsData || !examResult) {
                    var errMsg = 'completeExerciseSatSrv combinedSections:' +
                        'one or more of the arguments is missing!';
                    $log.error(errMsg, 'arguments:', arguments);
                    return $q.reject(errMsg);
                }
                resultsData = angular.copy(resultsData);
                questionsData = angular.copy(questionsData);
                var examId = exam.id;
                var subjectId = questionsData.subjectId;
                var currentSectionId = questionsData.id;
                var sectionResults = examResult.sectionResults;
                var sectionProms = [];
                var getOtherSections = exam.sections.filter(function (section) {
                    return section.subjectId === subjectId && currentSectionId !== section.id;
                });
                angular.forEach(getOtherSections, function (sectionBySubject) {
                    var sectionKey = sectionResults[sectionBySubject.id];
                    if (sectionKey) {
                        var exerciseResultProm = ExerciseResultSrv.getExerciseResult(ExerciseTypeEnum.SECTION.enum, sectionBySubject.id, examId, null, true);
                        var examSectionProm = ExamSrv.getExamSection(sectionBySubject.id);
                        sectionProms.push(exerciseResultProm);
                        sectionProms.push(examSectionProm);
                    }
                });
                if (sectionProms.length === 0) {
                    return $q.when(false);
                }
                return $q.all(sectionProms).then(function (results) {
                    var lengthResults = 0;
                    angular.forEach(results, function (result, index) {
                        if (result.isComplete) {
                            questionsData.questions = questionsData.questions.concat(results[index + 1].questions);
                            resultsData.questionResults = resultsData.questionResults.concat(result.questionResults);
                            lengthResults += 2;
                        }
                    });
                    if (results.length !== lengthResults) {
                        return $q.when(false);
                    }
                    return {
                        questionsData: questionsData,
                        resultsData: resultsData
                    };
                });
            };

            this.afterBroadcastFinishExercise = function (data) {
                var isSection = data.exerciseDetails.exerciseTypeId === ExerciseTypeEnum.SECTION.enum;
                var isEssay = data.exerciseContent.subjectId === SubjectEnum.ESSAY.enum;
                // only if it's section and not essay, save score!
                if (isSection && !isEssay) {
                    prepareDataForExerciseFinish(data).then(function (result) {
                        if (result.sectionScoring) {
                            saveSectionScoring(result.examResult, result.sectionScoring.sectionScore, result.exercise.subjectId);
                        }
                        if (result.testScoring) {
                            saveTestScoring(result.examResult, result.testScoring.testScore, result.exercise.categoryId);
                        }
                        result.examResult.$save();
                    });
                }
            };
        });
})(angular);
