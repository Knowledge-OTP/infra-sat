describe('znkExerciseSat service:', function () {
    beforeEach(angular.mock.module('actWebApp', 'pascalprecht.translate', 'auth.mock'));
    beforeEach(angular.mock.module('pascalprecht.translate', function ($translateProvider) {
        $translateProvider.translations('en', {});
    }));

    var $rootScope;
    var questions = [
        {
            id: 12544,
            crossTestScoreId: null,
            quid: 'V-RC-00-00-0000-II-SUMM-0000-0000-SENS-FC-MC-2-10984',
            subjectId: 7
        },
        {
            id: 12544,
            crossTestScoreId: 1,
            quid: 'V-RC-CE-00-0000-II-SUMM-0000-0000-SENS-FC-MC-2-10984',
            subjectId: 7
        },
        {
            id: 12544,
            crossTestScoreId: 0,
            quid: 'V-RC-CE-PS-0000-II-SUMM-0000-0000-SENS-FC-MC-2-10984',
            subjectId: 7
        },
        {
            id: 12544,
            crossTestScoreId: null,
            quid: 'V-RC-PA-00-0000-II-SUMM-0000-0000-SENS-FC-MC-2-10984',
            subjectId: 7
        },
        {
            id: 12544,
            crossTestScoreId: 1,
            quid: 'V-RC-WC-00-0000-II-SUMM-0000-0000-SENS-FC-MC-2-10984',
            subjectId: 7
        },
        {
            id: 12544,
            crossTestScoreId: 1,
            quid: 'V-RC-EI-00-0000-II-SUMM-0000-0000-SENS-FC-MC-2-10984',
            subjectId: 7
        },
        {
            id: 12544,
            crossTestScoreId: 0,
            quid: 'V-RC-CE-EI-0000-II-SUMM-0000-0000-SENS-FC-MC-2-10984',
            subjectId: 7
        },
        {
            id: 12544,
            crossTestScoreId: 0,
            quid: 'V-RC-00-00-0000-II-SUMM-0000-0000-SENS-FC-MC-2-10984',
            subjectId: 7
        },
        {
            id: 12544,
            crossTestScoreId: 1,
            quid: 'V-RC-HA-CE-0000-II-SUMM-0000-0000-SENS-FC-MC-2-10984',
            subjectId: 7
        },
        {
            id: 12544,
            crossTestScoreId: null,
            quid: 'V-RC-HA-00-0000-II-SUMM-0000-0000-SENS-FC-MC-2-10984',
            subjectId: 7
        }
    ];
    var questionsResults = [
        {
            questionId: 12544,
            userAnswer: 1,
            isAnsweredCorrectly: false
        },
        {
            questionId: 12544,
            userAnswer: 2,
            isAnsweredCorrectly: false
        },
        {
            questionId: 12544
        },
        {
            questionId: 12544
        },
        {
            questionId: 12544
        },
        {
            questionId: 12544
        },
        {
            questionId: 12544,
            userAnswer: 2,
            isAnsweredCorrectly: false
        },
        {
            questionId: 12544,
            userAnswer: 3,
            isAnsweredCorrectly: true
        },
        {
            questionId: 12544,
            userAnswer: 2,
            isAnsweredCorrectly: true
        },
        {
            questionId: 12544,
            userAnswer: 4,
            isAnsweredCorrectly: true
        }
    ];

    var sections = [
        {
            calculator: null,
            categoryId: 10,
            examId: 15,
            id: 1108,
            name: 'Reading Section - Test 1',
            order: 1,
            questionCount: 52,
            questions: questions,
            subjectId: 7
        },
        {
            calculator: null,
            categoryId: 11,
            examId: 15,
            id: 1116,
            name: 'Writing Section - Test 1',
            order: 2,
            questionCount: 52,
            questions: questions,
            subjectId: 7
        },
        {
            calculator: null,
            categoryId: 9,
            examId: 15,
            id: 1123,
            name: 'Math (No Calc) Section - Test 1',
            order: 3,
            questionCount: 52,
            questions: questions,
            subjectId: 0
        },
        {
            calculator: null,
            categoryId: 9,
            examId: 15,
            id: 1130,
            name: 'Math (Yes Calc) Section - Test 1',
            order: 4,
            questionCount: 52,
            questions: questions,
            subjectId: 0
        }
    ];

    var sectionsResults = [
        {
            exerciseId: '1108',
            isComplete: true,
            questionResults: questionsResults
        },
        {
            exerciseId: '1116',
            isComplete: true,
            questionResults: questionsResults
        },
        {
            exerciseId: '1123',
            isComplete: true,
            questionResults: questionsResults
        },
        {
            exerciseId: '1130',
            isComplete: true,
            questionResults: questionsResults
        }
    ];

    var exam = {
        id: 14,
        sections: sections,
        typeId: null
    };

    var examResult = {
        examId: 14,
        sectionResults: {
            1130: 'bf9ebf49-5c15-483a-0ea9-a6d637fc242e'
        }
    };

    var sectionsResultsNotComplete = false;
    beforeEach(function () {
        angular.mock.module(function ($provide) {
            $provide.factory('ExerciseResultSrv', function ($q) {
                return {
                    getExerciseResult: function () {
                        var newSectionResults = angular.copy(sectionsResults);
                        if (sectionsResultsNotComplete) {
                            newSectionResults[3].isComplete = false;
                        }
                        return $q.when(newSectionResults[3]);
                    }
                };
            });
            $provide.factory('ExamSrv', function ($q) {
                return {
                    getExamSection: function () {
                        return $q.when(sections[3]);
                    }
                };
            });
        });
    });

    var ZnkExerciseSatSrv;

    beforeEach(inject([
        '$injector',
        function ($injector) {
            $rootScope = $injector.get('$rootScope');
            ZnkExerciseSatSrv = $injector.get('ZnkExerciseSatSrv');
        }
    ]));

    it('when all test scores completed then isSectionCompleted should return a section object which combines questions and results of all test score', function () {
        var mergedTestScoresIfCompleted = ZnkExerciseSatSrv.mergedTestScoresIfCompleted(exam, examResult, sections[2], sectionsResults[2]);
        var result;
        mergedTestScoresIfCompleted.then(function (data) {
            result = data;
        });
        $rootScope.$digest();
        expect(result.questionsData.questions.length).toEqual(20);
        expect(result.resultsData.questionResults.length).toEqual(20);
    });

    it('when other test score are not completed then it should return false', function () {
        sectionsResultsNotComplete = true; // change sectionsResults[3].isComplete = false;
        var mergedTestScoresIfCompleted = ZnkExerciseSatSrv.mergedTestScoresIfCompleted(exam, examResult, sections[2], sectionsResults[2]);
        var result;
        mergedTestScoresIfCompleted.then(function (data) {
            result = data;
        });
        $rootScope.$digest();
        expect(result).toBeFalsy();
    });

    it('when there\'s no sectionResults that\'s matching other test score with same subject id should return false', function () {
        sectionsResultsNotComplete = false; // stay sectionsResults[3].isComplete = true;
        var newExamResult = angular.copy(examResult);
        newExamResult.sectionResults = {};
        var mergedTestScoresIfCompleted = ZnkExerciseSatSrv.mergedTestScoresIfCompleted(exam, newExamResult, sections[2], sectionsResults[2]);
        var result;
        mergedTestScoresIfCompleted.then(function (data) {
            result = data;
        });
        $rootScope.$digest();
        expect(result).toBeFalsy();
    });

    it('when some of the arguments didn\'t pass to function isSectionCompleted, should reject', function () {
        sectionsResultsNotComplete = false; // stay sectionsResults[3].isComplete = true;
        var mergedTestScoresIfCompleted = ZnkExerciseSatSrv.mergedTestScoresIfCompleted(exam, examResult, sections[2]);
        var result;
        mergedTestScoresIfCompleted.catch(function (data) {
            result = data;
        });
        $rootScope.$digest();
        expect(result).toEqual(jasmine.any(String));
    });
});
