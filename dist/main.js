(function (angular) {
    'use strict';

    angular.module('znk.infra-sat', [
        "znk.infra-sat.completeExerciseSat",
"znk.infra-sat.configSat",
"znk.infra-sat.examUtility",
"znk.infra-sat.exerciseUtilitySat",
"znk.infra-sat.lessonTopic",
"znk.infra-sat.performance",
"znk.infra-sat.socialSharingSat",
"znk.infra-sat.userGoals"
    ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra-sat.completeExerciseSat', [
        'znk.infra-web-app.completeExercise',
        'znk.infra.znkExercise',
        'znk.infra.contentGetters',
        'znk.infra.estimatedScore',
        'znk.infra-sat.exerciseUtilitySat',
        'znk.infra-sat.examUtility',
        'znk.infra-sat.socialSharingSat',
        'chart.js',
        'znk.infra-sat.performance'
    ]);
})(angular);

(function (angular) {
    'use strict';
    
    angular.module('znk.infra-sat.completeExerciseSat')
        .config(["ExerciseCycleSrvProvider", function (ExerciseCycleSrvProvider) {
            'ngInject';
            ExerciseCycleSrvProvider.setInvokeFunctions({
                afterBroadcastFinishExercise: ["completeExerciseSatSrv", function (completeExerciseSatSrv) {
                    'ngInject';//jshint ignore:line
                    return function (data) {
                        return completeExerciseSatSrv.afterBroadcastFinishExercise(data);
                    };
                }]
            });
        }]);
})(angular);
(function () {
    'use strict';

    angular.module('znk.infra-sat.completeExerciseSat')
        .config(["SvgIconSrvProvider", function (SvgIconSrvProvider) {
            'ngInject';

            var svgMap = {
                'complete-exercise-correct-icon': 'components/completeExerciseSat/svg/correct-icon.svg',
                'complete-exercise-wrong-icon': 'components/completeExerciseSat/svg/wrong-icon.svg',
                'znk-app-name-logo': 'components/configSat/svg/znk-app-name-logo.svg'
            };
            SvgIconSrvProvider.registerSvgSources(svgMap);
        }]);
})();


(function () {
    'use strict';

    angular.module('znk.infra-sat.completeExerciseSat')
        .config(["QuestionTypesSrvProvider", "exerciseTypeConst", "CategoryServiceProvider", "TestScoreCategoryEnumProvider", function (QuestionTypesSrvProvider, exerciseTypeConst, CategoryServiceProvider, TestScoreCategoryEnumProvider) {
            'ngInject';

            function questionTypeGetter(question) {
                var templatesContants = {
                    SIMPLE_QUESTION: 0,
                    MATH_QUESTION: 1,
                    WRITING_SPECIFIC_PARAGRAPH: 2,
                    WRITING_FULL_PASSAGE: 3,
                    READING_QUESTION: 4,
                    ESSAY_QUESTION: 5,
                    LECTURE_QUESTION: 6
                };

                // lecture question or simple question.
                if ((angular.isDefined(question.exerciseTypeId) && question.exerciseTypeId === exerciseTypeConst.LECTURE) || (question.groupDataId === null && question.paragraph === null)) {
                    return question.exerciseTypeId === exerciseTypeConst.LECTURE ? templatesContants.LECTURE_QUESTION : templatesContants.SIMPLE_QUESTION;
                }

                var categoryService = CategoryServiceProvider.$get();
                var TestScoreCategoryEnum = TestScoreCategoryEnumProvider.$get();

                return categoryService.getCategoryLevel2Parent(question.categoryId).then(function (testScoreObj) {
                    switch (testScoreObj.id) {

                        case TestScoreCategoryEnum.MATH.enum:
                            return templatesContants.MATH_QUESTION;

                        case TestScoreCategoryEnum.WRITING.enum:
                            if (question.paragraph !== null && question.paragraph.length > 0) {
                                return templatesContants.WRITING_SPECIFIC_PARAGRAPH;
                            }
                            return templatesContants.WRITING_FULL_PASSAGE;

                        case TestScoreCategoryEnum.READING.enum:
                            return templatesContants.READING_QUESTION;

                        case TestScoreCategoryEnum.ESSAY.enum:
                            return templatesContants.ESSAY_QUESTION;

                        default:
                            return templatesContants.SIMPLE_QUESTION;
                    }
                });
            }

            QuestionTypesSrvProvider.setQuestionTypeGetter(questionTypeGetter);

            var map = {
                0: '<simple-question></simple-question>',
                1: '<math-question></math-question>',
                2: '<writing-specific-paragraph></writing-specific-paragraph>',
                3: '<writing-full-passage></writing-full-passage>',
                4: '<reading-question></reading-question>',
                5: '<essay-question></essay-question>',
                6: '<lecture-question></lecture-question>'
            };
            QuestionTypesSrvProvider.setQuestionTypesHtmlTemplate(map);
        }])
        .config(["ZnkExerciseSrvProvider", "exerciseTypeConst", function (ZnkExerciseSrvProvider, exerciseTypeConst) {
            'ngInject';

            var allowedTimeForQuestionByExercise = {};
            allowedTimeForQuestionByExercise[exerciseTypeConst.TUTORIAL] = 1.5 * 60 * 1000;
            allowedTimeForQuestionByExercise[exerciseTypeConst.DRILL] = 40 * 1000;
            allowedTimeForQuestionByExercise[exerciseTypeConst.PRACTICE] = 40 * 1000;
            ZnkExerciseSrvProvider.setAllowedTimeForQuestionMap(allowedTimeForQuestionByExercise);
        }]);
})();


(function (angular) {
    'use strict';

    angular.module('znk.infra-sat.completeExerciseSat')
        .directive('article',function articleDirective() {
            'ngInject';

            var directive = {
                templateUrl: 'components/completeExerciseSat/templates/article.template.html',
                scope: {
                    contentGetter: '&content',
                    deleteUnderScores: '&'
                },
                link: function(scope, element, attrs) {
                    function stringEndsWith(str, searchString) {
                        return str.indexOf(searchString, str.length - searchString.length) !== -1;
                    }

                    function injectLineNumbersToHtml(htmlString) {
                        var start = false;
                        var htmlParagraphs = htmlString.split(/<\s*p\s*>|<\s*p\s*\/\s*>/gi);
                        var j, i, ln = 0;
                        var res = '';
                        for (j = 0; j < htmlParagraphs.length; ++j) {
                            if (htmlParagraphs[j] === '') {
                                continue;
                            }

                            var htmlLines = htmlParagraphs[j].split(/<\s*br\s*>|<\s*br\s*\/\s*>/gi);
                            for (i = 0; i < htmlLines.length; ++i) {
                                if (htmlLines[i].match('_')) {
                                    htmlLines[i] = '<br><span class=\"indented-line\">' + htmlLines[i].replace('_', '') + '</span>';
                                    start = true;
                                }
                                if (!start) {
                                    continue;
                                }
                                ln += 1;
                                if (ln === 1 || ln % 5 === 0) {
                                    if (stringEndsWith(htmlLines[i], '</p>')) {
                                        var lastTagIndex = htmlLines[i].lastIndexOf('<');
                                        var lastTag = htmlLines[i].substr(lastTagIndex);
                                        var markupStart = htmlLines[i].substr(0, lastTagIndex);
                                        htmlLines[i] = markupStart + '<span class=\"num-article\">' + String(ln) + '</span>' + lastTag;
                                    } else {
                                        htmlLines[i] = htmlLines[i] + '<span class=\"num-article\">' + String(ln) + '</span>';
                                    }
                                }
                                htmlLines[i] = htmlLines[i] + '<br>';
                            }
                            res = res + '<p>' + htmlLines.join('') + '</p>';
                        }
                        return '<div class=\"wrap-num-article\">' + res + '</div>';
                    }

                    function arrayMarkups(contentArr) {
                        var markup = '';

                        angular.forEach(contentArr, function (item) {
                            if (item[attrs.markupField]) {
                                markup += item[attrs.markupField];
                            }
                        });

                        return markup;
                    }

                    var content = scope.contentGetter();

                    if (angular.isArray(content)) {
                        content = arrayMarkups(content);
                    }

                    if (content) {
                        content = content.replace(/font\-family: \'Lato Regular\';/g, 'font-family: Lato;font-weight: 400;');
                        if (scope.deleteUnderScores()) {
                            angular.element(element[0].querySelector('.article-content')).html(content.replace(/_/g, ''));
                        } else {
                            angular.element(element[0].querySelector('.article-content')).html(injectLineNumbersToHtml(content));
                        }
                    }
                }
            };

            return directive;
        });
})(angular);

/**
 * attrs:
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra-sat.completeExerciseSat').component('completeExerciseSummary', {
        templateUrl: 'components/completeExerciseSat/directives/completeExerciseSummary/completeExerciseSummaryDirective.template.html',
        require: {
            completeExerciseCtrl: '^completeExercise'
        },
        controller: ["CompleteExerciseSrv", "SubjectEnum", "$q", "StatsSrv", "CategoryService", "TestScoreCategoryEnum", "$filter", "masteryLevel", "SubScoreSrv", "PerformanceData", function (CompleteExerciseSrv, SubjectEnum, $q, StatsSrv, CategoryService, TestScoreCategoryEnum, $filter, masteryLevel, SubScoreSrv, PerformanceData) {
            'ngInject';

            var translateFilter = $filter('translate');
            var $ctrl = this;
            var performanceDataProm = PerformanceData.getPerformanceData();
            function _initSuccessGauge() {
                var exerciseResult = $ctrl.completeExerciseCtrl.getExerciseResult();
                var exerciseContent = $ctrl.completeExerciseCtrl.getExerciseContent();

                $ctrl.performanceChart = {};
                $ctrl.performanceChart.gaugeSettings = {
                    labels: ['Correct', 'Wrong', 'Unanswered'],
                    data: [
                        exerciseResult.correctAnswersNum,
                        exerciseResult.wrongAnswersNum,
                        exerciseResult.skippedAnswersNum
                    ],
                    colours: ['#87ca4d', '#ff6766', '#ebebeb'],
                    options: {
                        segmentShowStroke: false,
                        percentageInnerCutout: 85,
                        showTooltips: false,
                        animation: false
                    }
                };

                var totalQuestionsNum = exerciseContent.questions.length;
                var totalCorrectNum = exerciseResult.correctAnswersNum || 0;
                $ctrl.performanceChart.successRate = parseInt(totalCorrectNum / totalQuestionsNum * 100);
            }

            function _initStats() {
                var exerciseResult = $ctrl.completeExerciseCtrl.getExerciseResult();
                // var exerciseContent = $ctrl.completeExerciseCtrl.getExerciseContent();

                $ctrl.statsTime = {};
                var avgTimePropToConvertToSeconds = ['correct', 'wrong', 'skipped'];
                avgTimePropToConvertToSeconds.forEach(function (avgTimeProp) {
                    var avgTimePropInResultObj = avgTimeProp + 'AvgTime';
                    $ctrl.statsTime[avgTimePropInResultObj] = parseInt(exerciseResult[avgTimePropInResultObj] / 1000);
                });
            }

            var _calcMasteryStats = (function(){
                function _calcAvgPercentage(num, total) {
                    return Math.round((num / total) * 100);
                }

                function _calcOldTestScoreMastery(testScoreStats) {
                    var exerciseResult = $ctrl.completeExerciseCtrl.getExerciseResult();

                    var totalQuestions = testScoreStats.totalQuestions;
                    var numOfTotalCorrectAnswers = testScoreStats.correct;

                    var numOfExerciseQuestions = exerciseResult.questionResults.length;
                    var numOfCorrectExerciseAnswers = exerciseResult.correctAnswersNum;

                    var oldNumOfTotalQuestions = totalQuestions - numOfExerciseQuestions;
                    var oldNumOfCorrectAnswers = numOfTotalCorrectAnswers - numOfCorrectExerciseAnswers;

                    return _calcAvgPercentage(oldNumOfCorrectAnswers, oldNumOfTotalQuestions);
                }

                function _isAnsweredCorrectly(questionId) {
                    var questionResult = $ctrl.completeExerciseCtrl.getExerciseResult().questionResults;
                    return questionResult.some(function (element, index, array) {
                        var result = array[index];
                        return questionId === result.questionId && result.isAnsweredCorrectly;
                    });
                }

                function _updateRawMastery(practicedCategory, question) {
                    var categoryId = practicedCategory.id;
                    if (angular.isUndefined($ctrl.categoryMastery[categoryId])) {
                        $ctrl.categoryMastery[categoryId] = {};
                        $ctrl.categoryMastery[categoryId].questionCount = 0;
                        $ctrl.categoryMastery[categoryId].correctAnswersNum = 0;
                        $ctrl.categoryMastery[categoryId].name = practicedCategory.name;
                    }
                    $ctrl.categoryMastery[categoryId].questionCount++;
                    $ctrl.categoryMastery[categoryId].correctAnswersNum += _isAnsweredCorrectly(question.id) ? 1 : 0;
                }

                function _setSubScoreMastery(questions) {
                    var promArr = [];
                    angular.forEach(questions, function (question) {
                        var prom = SubScoreSrv.getSpecificCategorySubScores(question.categoryId).then(function (subScoredArr) {
                            if (subScoredArr.length > 0) {  // there are questions that not related to any sub score.
                                angular.forEach(subScoredArr, function (subScore) {
                                    _updateRawMastery(subScore, question);
                                });
                            }
                        });
                        promArr.push(prom);
                    });
                    return promArr;
                }

                function _setGeneralMastery(questions) {
                    var promArr = [];
                    angular.forEach(questions, function (question) {
                        var categoryId = question.categoryId;
                        var prom = CategoryService.getParentCategory(categoryId).then(function (generalCategory) {
                            _updateRawMastery(generalCategory, question);
                        });
                        promArr.push(prom);
                    });
                    return promArr;
                }

                function _getCategoryProgressById(categoriesArray, categoryId) {
                    for (var i = 0; i < categoriesArray.length; i++) {
                        if (+categoriesArray[i].categoryId === +categoryId) {
                            return categoriesArray[i].progress;
                        }
                    }
                }

                function _calcCategoryMastery(categoryRawMastery) {
                    var subjectId = $ctrl.completeExerciseCtrl.getExerciseResult().subjectId;

                    performanceDataProm.then(function (performanceData) {
                        var subScoresKeys = Object.keys(categoryRawMastery);
                        var subScoresArray = performanceData[subjectId].subscoreArray;

                        angular.forEach(subScoresKeys, function (subScoreKey) {
                            var progress = _getCategoryProgressById(subScoresArray, subScoreKey);
                            categoryRawMastery[subScoreKey].progress = progress;
                            categoryRawMastery[subScoreKey].mastery = masteryLevel.getMasteryLevel(progress);
                        });
                    });
                }

                return function () {
                    var exerciseCategoryId = $ctrl.completeExerciseCtrl.getExerciseContent().categoryId;

                    var TEST_SCORE = 2;

                    $ctrl.testScoreMastery = {};
                    $q.all([
                        StatsSrv.getLevelStats(TEST_SCORE),
                        CategoryService.getCategoryLevel2Parent(exerciseCategoryId)
                    ])
                        .then(function (res) {
                            var testScoreStats = res[0];
                            var testScoreCategory = res[1];

                            var testScoreName = TestScoreCategoryEnum.getValByEnum(testScoreCategory.id);
                            testScoreName = angular.uppercase(testScoreName);
                            $ctrl.testScoreMastery.testScorename = translateFilter('COMPLETE_EXERCISE_SAT.COMPLETE_EXERCISE_SUMMARY.' + testScoreName);

                            var TEST_SCORE_ID = 'id_' + testScoreCategory.id;
                            testScoreStats = testScoreStats[TEST_SCORE_ID];
                            $ctrl.testScoreMastery.progress = _calcAvgPercentage(testScoreStats.correct, testScoreStats.totalQuestions);
                            $ctrl.testScoreMastery.mastery = masteryLevel.getMasteryLevel($ctrl.testScoreMastery.progress);

                            var oldTestScoreMastery = _calcOldTestScoreMastery(testScoreStats);
                            $ctrl.testScoreDelta = $ctrl.testScoreMastery.progress - oldTestScoreMastery;
                        });

                    $ctrl.categoryMastery = {};

                    var exerciseContent = $ctrl.completeExerciseCtrl.getExerciseContent();
                    var subjectId = $ctrl.completeExerciseCtrl.getExerciseResult().subjectId;
                    var _questions = exerciseContent .questions;
                    var promArr;
                    if (subjectId !== SubjectEnum.ESSAY.enum) {
                        promArr = _setSubScoreMastery(_questions);
                    } else {
                        promArr = _setGeneralMastery(_questions);
                    }
                    $q.all(promArr).then(function () {
                        _calcCategoryMastery($ctrl.categoryMastery);
                    });
                };
            })();

            this.$onInit = function () {
                _initSuccessGauge();

                _initStats();

                _calcMasteryStats();

                this.exerciseResult = $ctrl.completeExerciseCtrl.getExerciseResult();
                this.exerciseContent = $ctrl.completeExerciseCtrl.getExerciseContent();
                this.isEssaySubject = this.exerciseResult.subjectId === SubjectEnum.ESSAY.enum;

                if(!this.exerciseResult.seenSummary){
                    this.notSeenSummary = true;
                    this.exerciseResult.seenSummary = true;
                    this.exerciseResult.$save();
                }

                this.goToSummary = function () {
                    this.completeExerciseCtrl.changeViewState(CompleteExerciseSrv.VIEW_STATES.EXERCISE);
                };
            };
        }]
    });
})(angular);


(function (angular) {
    'use strict';

    angular.module('znk.infra-sat.completeExerciseSat')
        .directive('customAnswerBuilderSat', ["ZnkExerciseViewModeEnum", "AnswerTypeEnum", function (ZnkExerciseViewModeEnum, AnswerTypeEnum) {
            'ngInject';

            function compileFn() {
                function preFn(scope, element, attrs, ctrls) {
                    var questionBuilderCtrl = ctrls[0];
                    var ngModelCtrl = ctrls[1];
                    var viewMode = questionBuilderCtrl.getViewMode();
                    var question = questionBuilderCtrl.question;

                    scope.d = {};
                    var isFreeTextAnswer = question.answerTypeId === AnswerTypeEnum.FREE_TEXT_ANSWER.enum;
                    var isAnswerWithResultMode = viewMode === ZnkExerciseViewModeEnum.ANSWER_WITH_RESULT.enum;
                    var isReviewMode = viewMode === ZnkExerciseViewModeEnum.REVIEW.enum;
                    var isUserNotAnswered = angular.isUndefined(ngModelCtrl.$viewValue);
                    if (isFreeTextAnswer && isUserNotAnswered && !isReviewMode) {
                        scope.d.showFreeTextInstructions = true;
                        if (isAnswerWithResultMode) {
                            ngModelCtrl.$viewChangeListeners.push(function () {
                                scope.d.showFreeTextInstructions = false;
                            });
                        }
                    }
                }

                return {
                    pre: preFn
                };
            }

            var directive = {
                templateUrl: 'components/completeExerciseSat/templates/customAnswerBuilderSat.template.html',
                restrict: 'E',
                require: ['^questionBuilder', '^ngModel'],
                scope: {},
                compile: compileFn
            };

            return directive;
        }]);
})(angular);


(function (angular) {
    'use strict';

    angular.module('znk.infra-sat.completeExerciseSat')
        .directive('essayQuestion', function essayQuestionDirective() {
            'ngInject';

            function compileFn() {
                function preFn(scope, element, attrs, questionBuilderCtrl) {
                    scope.vm = {
                        question: questionBuilderCtrl.question
                    };

                    var questionContainerDomElement = angular.element(element[0].querySelector('.question-container'));
                    var paragraphArray = questionBuilderCtrl.question.groupData.paragraphs;

                    for (var i = 0; i < paragraphArray.length; i++) {
                        questionContainerDomElement.append(paragraphArray[i].body.replace(/_/g, ''));
                    }

                    angular.element(element[0].querySelector('.question-content')).append(questionBuilderCtrl.question.content);
                }

                return {
                    pre: preFn
                };
            }

            var directive = {
                templateUrl: 'components/completeExerciseSat/templates/essayQuestion.template.html',
                restrict: 'E',
                require: '^questionBuilder',
                scope: {},
                compile: compileFn
            };

            return directive;
        });
})(angular);





(function (angular) {
    'use strict';

    angular.module('znk.infra-sat.completeExerciseSat')
        .directive('freeTextAnswer', ["ZnkExerciseViewModeEnum", "$timeout", function (ZnkExerciseViewModeEnum, $timeout) {
            'ngInject';

            return {
                templateUrl: 'components/completeExerciseSat/templates/freeTextAnswer.template.html',
                require: ['^ngModel', '^answerBuilder'],
                scope: {},
                link: function (scope, element, attrs, ctrls) {
                    var ngModelCtrl = ctrls[0];
                    var answerBuilderCtrl = ctrls[1];
                    var userAnswerValidation = /^[0-9\/\.]{0,4}$/;

                    scope.d = {};

                    scope.d.userAnswer = '';  // stores the current userAnswer
                    scope.d.userAnswerGetterSetter = function (newUserAnswer) {
                        if (arguments.length && _isAnswerValid(newUserAnswer)) {
                            scope.d.userAnswer = newUserAnswer;
                            return scope.d.userAnswer;
                        }
                        return scope.d.userAnswer;
                    };

                    function _isAnswerValid(answerToCheck) {
                        return userAnswerValidation.test(answerToCheck);
                    }

                    var MODE_ANSWER_ONLY = ZnkExerciseViewModeEnum.ONLY_ANSWER.enum,
                        MODE_REVIEW = ZnkExerciseViewModeEnum.REVIEW.enum,
                        MODE_MUST_ANSWER = ZnkExerciseViewModeEnum.MUST_ANSWER.enum;

                    scope.clickHandler = function () {
                        ngModelCtrl.$setViewValue(scope.d.userAnswer);
                        updateViewByCorrectAnswers(scope.d.userAnswer);
                    };

                    function updateViewByCorrectAnswers(userAnswer) {
                        var correctAnswers = answerBuilderCtrl.question.correctAnswerText;
                        var viewMode = answerBuilderCtrl.getViewMode();
                        scope.correctAnswer = correctAnswers[0].content;

                        if (viewMode === MODE_ANSWER_ONLY || viewMode === MODE_MUST_ANSWER) {
                            scope.d.userAnswer = angular.isDefined(userAnswer) ? userAnswer : '';
                            scope.showCorrectAnswer = false;
                        } else {
                            if (angular.isUndefined(userAnswer)) {
                                // unanswered question
                                scope.userAnswerStatus = 'neutral';
                                scope.showCorrectAnswer = viewMode === MODE_REVIEW;
                            } else {
                                if (_isAnsweredCorrectly(userAnswer, correctAnswers)) {
                                    scope.userAnswerStatus = 'correct';
                                } else {
                                    scope.userAnswerStatus = 'wrong';
                                }
                                scope.showCorrectAnswer = true;
                                scope.d.userAnswer = userAnswer;
                            }
                        }
                    }

                    function _isAnsweredCorrectly(userAnswer, correctAnswers) {
                        for (var i = 0; i < correctAnswers.length; i++) {
                            if (userAnswer === correctAnswers[i].content) {
                                return true;
                            }
                        }
                        return false;
                    }

                    ngModelCtrl.$render = function () {
                        //  skip one digest cycle in order to let the answers time to be compiled
                        $timeout(function () {
                            updateViewByCorrectAnswers(ngModelCtrl.$viewValue);
                        });
                    };

                    ngModelCtrl.$render();
                }
            };
        }]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra-sat.completeExerciseSat')
        .directive('lectureQuestion', function () {
            'ngInject';

            function compileFn() {
                function preFn(scope, element, attrs, questionBuilderCtrl) {
                    scope.vm = {
                        question: questionBuilderCtrl.question
                    };
                }

                return {
                    pre: preFn
                };
            }

            var directive = {
                templateUrl: 'components/completeExerciseSat/templates/lectureQuestion.template.html',
                restrict: 'E',
                require: '^questionBuilder',
                scope: {},
                compile: compileFn
            };

            return directive;
        });
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra-sat.completeExerciseSat')
        .directive('mathQuestion', function () {
            'ngInject';

            function compileFn() {
                function preFn(scope, element, attrs, questionBuilderCtrl) {
                    var content = questionBuilderCtrl.question.content;
                    var answerContentElement = angular.element(element[0].querySelector('.answer-content'));
                    answerContentElement.append(content);

                    var questionContainerElement = angular.element(element[0].querySelector('.question-container'));
                    var paragraphsArray = questionBuilderCtrl.question.groupData.paragraphs;
                    for (var i = 0; i < paragraphsArray.length; i++) {
                        questionContainerElement.append(paragraphsArray[i].body);
                    }
                }

                return {
                    pre: preFn
                };
            }

            var directive = {
                templateUrl: 'components/completeExerciseSat/templates/mathQuestion.template.html',
                restrict: 'E',
                require: '^questionBuilder',
                scope: {},
                compile: compileFn
            };

            return directive;
        });
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra-sat.completeExerciseSat')
        .directive('rateAnswer', ["ZnkExerciseViewModeEnum", function (ZnkExerciseViewModeEnum) {
            'ngInject';

            return {
                templateUrl: 'components/completeExerciseSat/templates/rateAnswer.template.html',
                require: ['^answerBuilder', '^ngModel'],
                scope: {},
                link: function link(scope, element, attrs, ctrls) {
                    var domElement = element[0];

                    var answerBuilder = ctrls[0];
                    var ngModelCtrl = ctrls[1];

                    var viewMode = answerBuilder.getViewMode();
                    var ANSWER_WITH_RESULT_MODE = ZnkExerciseViewModeEnum.ANSWER_WITH_RESULT.enum,
                        REVIEW_MODE = ZnkExerciseViewModeEnum.REVIEW.enum;
                    var INDEX_OFFSET = 2;

                    scope.d = {};
                    scope.d.itemsArray = new Array(11);
                    var answers = answerBuilder.question.correctAnswerText;

                    var domItemsArray;

                    var destroyWatcher = scope.$watch(
                        function () {
                            return element[0].querySelectorAll('.item-repeater');
                        },
                        function (val) {
                            if (val) {
                                destroyWatcher();
                                domItemsArray = val;

                                if (viewMode === REVIEW_MODE) {
                                    scope.clickHandler = angular.noop;
                                    updateItemsByCorrectAnswers(scope.d.answers);
                                } else {
                                    scope.clickHandler = clickHandler;
                                }

                                ngModelCtrl.$render = function () {
                                    updateItemsByCorrectAnswers();
                                };
                                ngModelCtrl.$render();
                            }
                        }
                    );

                    function clickHandler(index) {
                        if (answerBuilder.canUserAnswerBeChanged()) {
                            return;
                        }

                        ngModelCtrl.$setViewValue(index);
                        updateItemsByCorrectAnswers();
                    }

                    function updateItemsByCorrectAnswers() {
                        var oldSelectedElement = angular.element(domElement.querySelector('.selected'));
                        oldSelectedElement.removeClass('selected');

                        var selectedAnswerId = ngModelCtrl.$viewValue;

                        var newSelectedElement = angular.element(domItemsArray[selectedAnswerId]);
                        newSelectedElement.addClass('selected');

                        var lastElemIndex = answers.length - 1;

                        if ((viewMode === ANSWER_WITH_RESULT_MODE && angular.isNumber(selectedAnswerId)) || viewMode === REVIEW_MODE) {
                            for (var i = 0; i < lastElemIndex; i++) {
                                angular.element(domItemsArray[answers[i].id - INDEX_OFFSET]).addClass('correct');
                            }
                            angular.element(domItemsArray[answers[lastElemIndex].id - INDEX_OFFSET]).addClass('correct-edge');
                        }

                        if (angular.isNumber(selectedAnswerId) && (viewMode === REVIEW_MODE || viewMode === ANSWER_WITH_RESULT_MODE)) {
                            if (selectedAnswerId >= answers[0].id - INDEX_OFFSET && selectedAnswerId <= answers[lastElemIndex].id - INDEX_OFFSET) {
                                angular.element(domItemsArray[selectedAnswerId]).addClass('selected-correct');
                            } else {
                                angular.element(domItemsArray[selectedAnswerId]).addClass('selected-wrong');
                            }
                        }
                    }
                }
            };
        }]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra-sat.completeExerciseSat')
        .directive('readingQuestion', ["articleSrv", function (articleSrv) {
            'ngInject';

            function compileFn() {
                function preFn(scope, element, attrs, questionBuilderCtrl) {
                    scope.vm = {
                        question: questionBuilderCtrl.question
                    };

                    var content = articleSrv.numberLines(questionBuilderCtrl.question.groupData.paragraphs);
                    content = content.replace(/font-family:Lato Light;/g, 'font-family: Lato;font-weight: 300;');
                    var articleLinesElement = angular.element('<div class=\"wrap-num-article\"></div>');
                    var articleContentElement = angular.element(element[0].querySelector('.article-content'));
                    // content.replace(/font\-family:\'Lato Light\';/g, 'font-family: Lato;font-weight: 400;');

                    articleLinesElement.append(content);
                    articleContentElement.append(articleLinesElement);

                    angular.element(element[0].querySelector('.paragraph-title')).append(questionBuilderCtrl.question.paragraphTitle);
                    angular.element(element[0].querySelector('.question-content')).append(questionBuilderCtrl.question.content);
                    scope.vm.passageTitle = scope.vm.question.passageTitle;
                }

                return {
                    pre: preFn
                };
            }

            var directive = {
                templateUrl: 'components/completeExerciseSat/templates/readingQuestion.template.html',
                restrict: 'E',
                require: '^questionBuilder',
                scope: {},
                compile: compileFn
            };

            return directive;
        }]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra-sat.completeExerciseSat')
        .directive('selectAnswer', ["$timeout", "ZnkExerciseViewModeEnum", "ZnkExerciseAnswersSrv", "ZnkExerciseEvents", "$document", function ($timeout, ZnkExerciseViewModeEnum, ZnkExerciseAnswersSrv, ZnkExerciseEvents, $document) {
            'ngInject';

            return {
                templateUrl: 'components/completeExerciseSat/templates/selectAnswer.template.html',
                require: ['^answerBuilder', '^ngModel'],
                restrict: 'E',
                scope: {},
                link: function (scope, element, attrs, ctrls) {
                    var answerBuilder = ctrls[0];
                    var ngModelCtrl = ctrls[1];
                    var questionIndex = answerBuilder.question.__questionStatus.index;
                    var currentSlide = answerBuilder.getCurrentIndex();    // current question/slide in the viewport
                    var body = $document[0].body;


                    var MODE_ANSWER_WITH_QUESTION = ZnkExerciseViewModeEnum.ANSWER_WITH_RESULT.enum,
                        MODE_ANSWER_ONLY = ZnkExerciseViewModeEnum.ONLY_ANSWER.enum,
                        MODE_REVIEW = ZnkExerciseViewModeEnum.REVIEW.enum,
                        MODE_MUST_ANSWER = ZnkExerciseViewModeEnum.MUST_ANSWER.enum;
                    var keyMap = {};

                    scope.d = {};

                    scope.d.answers = answerBuilder.question.answers;

                    scope.d.click = function (answer) {
                        var viewMode = answerBuilder.getViewMode();
                        if ((!isNaN(parseInt(ngModelCtrl.$viewValue, 10)) && viewMode === MODE_ANSWER_WITH_QUESTION) || viewMode === MODE_REVIEW) {
                            return;
                        }
                        ngModelCtrl.$setViewValue(answer.id);
                        updateAnswersFollowingSelection(viewMode);
                    };

                    function keyboardHandler(key) {
                        key = String.fromCharCode(key.keyCode).toUpperCase();
                        if (angular.isDefined(keyMap[key])) {
                            scope.d.click(scope.d.answers[keyMap[key]]);
                        }
                    }

                    if (questionIndex === currentSlide) {
                        body.addEventListener('keydown', keyboardHandler);
                    }

                    scope.$on(ZnkExerciseEvents.QUESTION_CHANGED, function (event, value, prevValue, currQuestion) {
                        var _currentSlide = currQuestion.__questionStatus.index;
                        if (questionIndex !== _currentSlide) {
                            body.removeEventListener('keydown', keyboardHandler);
                        } else {
                            body.addEventListener('keydown', keyboardHandler);
                        }
                    });


                    scope.d.getIndexChar = function (answerIndex) {
                        var key = ZnkExerciseAnswersSrv.selectAnswer.getAnswerIndex(answerIndex, answerBuilder.question);
                        keyMap[key] = answerIndex;
                        return key;
                    };

                    function updateAnswersFollowingSelection() {
                        var selectedAnswerId = ngModelCtrl.$viewValue;
                        var correctAnswerId = answerBuilder.question.correctAnswerId;
                        var $answers = angular.element(element[0].querySelectorAll('.answer'));
                        for (var i = 0; i < $answers.length; i++) {
                            var $answerElem = angular.element($answers[i]);
                            if (!$answerElem || !$answerElem.scope || !$answerElem.scope()) {
                                continue;
                            }

                            var answer = $answerElem.scope().answer;
                            var classToAdd,
                                classToRemove;

                            if (answerBuilder.getViewMode() === MODE_ANSWER_ONLY || answerBuilder.getViewMode() === MODE_MUST_ANSWER) {
                                // dont show correct / wrong indication
                                classToRemove = 'answered';
                                classToAdd = selectedAnswerId === answer.id ? 'answered' : 'neutral';
                            } else {
                                // the rest of the optional states involve correct / wrong indications
                                if (angular.isUndefined(selectedAnswerId)) {
                                    // unanswered question
                                    if (answerBuilder.getViewMode() === MODE_REVIEW) {
                                        classToAdd = correctAnswerId === answer.id ? 'answered-incorrect' : 'neutral';
                                    }
                                } else if (selectedAnswerId === answer.id) {
                                    // this is the selected answer
                                    classToAdd = correctAnswerId === answer.id ? 'correct' : 'wrong';
                                } else {
                                    // this is the correct answer but the user didn't select it
                                    classToAdd = answer.id === correctAnswerId ? 'answered-incorrect' : 'neutral';
                                }
                            }
                            $answerElem.removeClass(classToRemove);
                            $answerElem.addClass(classToAdd);
                        }
                    }

                    ngModelCtrl.$render = function () {
                        //  skip one digest cycle in order to let the answers time to be compiled
                        $timeout(function () {
                            updateAnswersFollowingSelection();
                        });
                    };
                    //  ng model controller render function not triggered in case render function was set
                    //  after the model value was changed
                    ngModelCtrl.$render();

                    scope.$on('exercise:viewModeChanged', function () {
                        ngModelCtrl.$render();
                    });

                    scope.$on('$destroy', function () {
                        body.removeEventListener('keydown', keyboardHandler);
                    });
                }
            };
        }]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra-sat.completeExerciseSat')
        .directive('simpleQuestion', function simpleQuestionDirective() {
            'ngInject';

            function compileFn() {
                function preFn(scope, element, attrs, questionBuilderCtrl) {
                    var content = questionBuilderCtrl.question.content.replace(/_/g, '');
                    var questionContentElement = angular.element(element[0].querySelector('.question-content'));
                    questionContentElement.append(content);
                }

                return {
                    pre: preFn
                };
            }

            var directive = {
                templateUrl: 'components/completeExerciseSat/templates/simpleQuestion.template.html',
                restrict: 'E',
                require: '^questionBuilder',
                scope: {},
                compile: compileFn
            };

            return directive;
        });
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra-sat.completeExerciseSat')
        .controller('SocialSharingController',
            ["SocialSharingSrv", "$filter", "SubjectEnum", "ENV", "$window", function (SocialSharingSrv, $filter, SubjectEnum, ENV, $window) {
                'ngInject';

                var self = this;
                var translateFilter = $filter('translate');
                self.showSocialArea = false;

                var subjectMap = {};
                subjectMap[SubjectEnum.MATH.enum] = 'math';
                subjectMap[SubjectEnum.VERBAL.enum] = 'verbal';

                // return if subjectId is in excludeArr
                if (self.excludeArr && angular.isArray(self.excludeArr)) {
                    for (var i = 0, ii = self.excludeArr.length; i < ii; i++) {
                        if (self.subjectId === self.excludeArr[i]) {
                            return;
                        }
                    }
                }

          SocialSharingSrv.getSharingData(self.subjectId).then(function (sharingData) {
                    self.showSocialArea = sharingData;

                    if (sharingData) {
                        self.subjectName = subjectMap[self.subjectId];
                        var image = $window.location.protocol + ENV.zinkerzWebsiteShareImgUrl + sharingData.shareUrlMap[self.subjectName];
                        var descriptionTranslate = sharingData.isImproved ? 'IMPROVED_TEXT' : 'SHARE_DESCRIPTION';
                        var description = translateFilter('SOCIAL_SHARING_CONTAINER_DRV.' + descriptionTranslate, { pts: sharingData.points, subjectName: self.subjectName });
                        var title = translateFilter('SOCIAL_SHARING_CONTAINER_DRV.SHARE_TITLE');
                        var caption = translateFilter('SOCIAL_SHARING_CONTAINER_DRV.SHARE_CAPTION');
                        var hashtags = translateFilter('SOCIAL_SHARING_CONTAINER_DRV.SHARE_HASHTAGS');
                        var shareUrl =  $window.location.protocol + ENV.zinkezWebsiteUrl;

                        self.shareData = {};                        
                        self.shareData.facebook = {
                            type: 'facebook',
                            display: 'popup',
                            link: shareUrl,
                            picture: image,
                            caption: caption,
                            description: description,
                            app_id: ENV.facebookAppId,
                            name: title
                        };

                        self.shareData.google = {
                            url: shareUrl,
                        };

                        self.shareData.twitter = {
                            type: 'twitter',
                            url: shareUrl,
                            text: description,
                            hashtags: hashtags
                        };
                    }
                });                
            }]);
})(angular);

(function(angular){
    'use strict';

    angular.module('znk.infra-sat.completeExerciseSat')
        .directive('socialSharing',function(){
            'ngInject';

            var directive = {
                scope: {
                    subjectId: '=',
                    excludeArr: '=?',
                    animate: '=?'
                },
                restrict: 'E',
                templateUrl: 'components/completeExerciseSat/directives/socialSharing/socialSharing.template.html',
                controller: 'SocialSharingController',
                bindToController: true,
                controllerAs: 'vm'
            };

            return directive;
        });
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra-sat.completeExerciseSat')
        .directive('writingFullPassage', function () {
            'ngInject';

            function compileFn() {
                function preFn(scope, element, attrs, questionBuilderCtrl) {
                    scope.vm = {
                        question: questionBuilderCtrl.question
                    };

                    var paragraphArray = questionBuilderCtrl.question.groupData.paragraphs;
                    var paragraphTitleDomElement = angular.element(element[0].querySelector('.paragraph-title'));
                    var questionContainerDomElement = angular.element(element[0].querySelector('.question-content'));
                    var paragraphsWrapperDomElement = angular.element(element[0].querySelector('.paragraphs-wrapper'));

                    paragraphTitleDomElement.append(questionBuilderCtrl.question.groupData.name);
                    questionContainerDomElement.append(questionBuilderCtrl.question.content);

                    for (var i = 0; i < paragraphArray.length; i++) {
                        var paragraphNumber = i + 1;
                        var paragrphTitleTempalte = '<div class="paragraph-number-title"> [ ' + paragraphNumber + ' ] </div>'; // paragraph title
                        paragraphsWrapperDomElement.append(paragrphTitleTempalte);

                        var paragraphElement = angular.element('<div class="paragraph"></div>');

                        paragraphElement.append(paragraphArray[i].body.replace(/_/g, ''));       // paragraph content
                        paragraphsWrapperDomElement.append(paragraphElement);
                    }
                }

                return {
                    pre: preFn
                };
            }

            var directive = {
                templateUrl: 'components/completeExerciseSat/templates/writingFullPassage.template.html',
                restrict: 'E',
                require: '^questionBuilder',
                scope: {},
                compile: compileFn
            };

            return directive;
        });
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra-sat.completeExerciseSat')
        .directive('writingSpecificParagraph', function () {
            'ngInject';

            function compileFn() {
                function preFn(scope, element, attrs, questionBuilderCtrl) {
                    scope.vm = {
                        question: questionBuilderCtrl.question,
                        SPECIFIC_PARAGRAPH: 1,
                        FULL_PASSAGE: 2
                    };
                    scope.vm.view = scope.vm.SPECIFIC_PARAGRAPH;

                    var paragraph = questionBuilderCtrl.question.paragraph.replace(/_/g, '');
                    var paragraphDomElement = angular.element(element[0].querySelector('.paragraph'));
                    var paragraphTitleDomElement = angular.element(element[0].querySelector('.paragraph-title'));
                    var questionContentDomElement = angular.element(element[0].querySelector('.question-content'));

                    paragraphDomElement.append(paragraph);
                    paragraphTitleDomElement.append(questionBuilderCtrl.question.paragraphTitle);
                    questionContentDomElement.append(questionBuilderCtrl.question.content);
                    var paragraphsArray = scope.vm.question.groupData.paragraphs;
                    var fullPassageElement = angular.element(element[0].querySelector('.full-passage'));
                    for (var i = 0; i < paragraphsArray.length; i++) {
                        fullPassageElement.append('<div class="paragraph-number-title">[' + (i + 1) + ']</div>');
                        fullPassageElement.append(paragraphsArray[i].body);
                    }
                }
                return {
                    pre: preFn
                };
            }

            var directive = {
                templateUrl: 'components/completeExerciseSat/templates/writingSpecificParagraph.template.html',
                restrict: 'E',
                require: '^questionBuilder',
                scope: {},
                compile: compileFn
            };

            return directive;
        });
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra-sat.completeExerciseSat')
        .service('articleSrv',function () {
            'ngInject';

            this.numberLines = function (content) {
                if (angular.isArray(content)) {
                    content = _arrayMarkups(content);
                }
                content = content.replace(/font\-family: \'Lato Regular\';/g, 'font-family: Lato;font-weight: 400;');

                var start = false;
                var htmlParagraphs = content.split(/<\s*p\s*>|<\s*p\s*\/\s*>/gi);
                var j, i, ln = 0;
                var res = '';
                for (j = 0; j < htmlParagraphs.length; ++j) {
                    if (htmlParagraphs[j] === '') {
                        continue;
                    }

                    var htmlLines = htmlParagraphs[j].split(/<\s*br\s*>|<\s*br\s*\/\s*>/gi);
                    for (i = 0; i < htmlLines.length; ++i) {
                        if (htmlLines[i].match('_')) {
                            htmlLines[i] = '<br><span class=\"indented-line\">' + htmlLines[i].replace('_', '') + '</span>';
                            start = true;
                        }
                        if (!start) {
                            continue;
                        }
                        if (htmlLines[i].match('#')) {
                            htmlLines[i] = htmlLines[i].replace('#', '');
                            continue;
                        }
                        ln += 1;
                        if (ln === 1 || ln % 5 === 0) {
                            if (_stringEndsWith(htmlLines[i], '</p>')) {
                                var lastTagIndex = htmlLines[i].lastIndexOf('<');
                                var lastTag = htmlLines[i].substr(lastTagIndex);
                                var markupStart = htmlLines[i].substr(0, lastTagIndex);
                                htmlLines[i] = markupStart + '<span class=\"num-article\">' + String(ln) + '</span>' + lastTag;
                            } else {
                                htmlLines[i] = htmlLines[i] + '<span class=\"num-article\">' + String(ln) + '</span>';
                            }
                        }
                        htmlLines[i] = htmlLines[i] + '<br>';
                    }
                    res = res + '<p>' + htmlLines.join('') + '</p>';
                }
                return res;
            };

            function _arrayMarkups(contentArr) {
                var markup = '';

                angular.forEach(contentArr, function (item) {
                    if (item.body) {
                        markup += item.body;
                    }
                });

                return markup;
            }

            function _stringEndsWith(str, searchString) {
                return str.indexOf(searchString, str.length - searchString.length) !== -1;
            }
        });
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra-sat.completeExerciseSat')
        .service('completeExerciseSatSrv', ["$q", "$log", "ExerciseTypeEnum", "SubjectEnum", "ExerciseResultSrv", "ExamSrv", "ScoringService", "ExerciseParentEnum", "CategoryService", function ($q, $log, ExerciseTypeEnum, SubjectEnum, ExerciseResultSrv, ExamSrv, ScoringService, ExerciseParentEnum, CategoryService) {
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
                if (data.exerciseParentTypeId === ExerciseParentEnum.MODULE.enum) {  //if it's a module sections there is no exerciseParentContent
                    examData = data.moduleExamData;                                  // so take the exam data from data.moduleExamData
                    examId = examData.id;
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
                            scoringSectionProm = ScoringService.getSectionScoreResult(questionResults, examData.typeId, exerciseResult.subjectId);
                            proms.sectionScoring = scoringSectionProm;
                            // if math - testScoring is calculated per section and not per test
                            if (exerciseResult.subjectId === SubjectEnum.MATH.enum) {
                                scoringTestProm = ScoringService.getTestScoreResult(questionResults, examData.typeId, exercise.categoryId);
                                proms.testScoring = scoringTestProm;
                            }
                        }
                        // if not math - testScoring is calculated per test
                        if (exerciseResult.subjectId !== SubjectEnum.MATH.enum) {
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
                var questionSubjectId = CategoryService.getCategoryLevel1ParentSync([questionsData.categoryId, questionsData.categoryId2]);
                var subjectId = questionSubjectId;                
                var sectionResults = examResult.sectionResults;
                var sectionProms = [];
                var getOtherSections = exam.sections.filter(function (section) {
                    var sectionSubjectId = CategoryService.getCategoryLevel1ParentSync([section.categoryId, section.categoryId2]);
                    return sectionSubjectId === subjectId && sectionSubjectId !== section.id;
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
                var isEssay = data.exerciseResult.subjectId === SubjectEnum.ESSAY.enum;
                // only if it's section and not essay, save score!
                if (isSection && !isEssay) {
                    prepareDataForExerciseFinish(data).then(function (result) {
                        var exerciseSubjectId = CategoryService.getCategoryLevel1ParentSync([result.exercise.categoryId, result.exercise.categoryId2]);
                        if (result.sectionScoring) {
                            saveSectionScoring(result.examResult, result.sectionScoring.sectionScore, exerciseSubjectId);
                        }
                        if (result.testScoring) {
                            saveTestScoring(result.examResult, result.testScoring.testScore, result.exercise.categoryId);
                        }
                        result.examResult.$save();
                    });
                }
            };
        }]);
})(angular);

angular.module('znk.infra-sat.completeExerciseSat').run(['$templateCache', function($templateCache) {
  $templateCache.put("components/completeExerciseSat/directives/completeExerciseSummary/completeExerciseSummaryDirective.template.html",
    "<div class=\"base-complete-exercise-container\"\n" +
    "     translate-namespace=\"COMPLETE_EXERCISE_SAT.COMPLETE_EXERCISE_SUMMARY\"\n" +
    "     subject-id-to-attr-drv=\"$ctrl.currentSubjectId\"\n" +
    "     ng-class=\"{\n" +
    "        'workout-summary-wrapper-essay': $ctrl.isEssaySubject\n" +
    "     }\">\n" +
    "    <complete-exercise-header></complete-exercise-header>\n" +
    "    <div class=\"complete-exercise-summary-wrapper\">\n" +
    "        <social-sharing\n" +
    "            subject-id=\"::$ctrl.exerciseResult.subjectId\"\n" +
    "            animate=\"true\">\n" +
    "        </social-sharing>\n" +
    "        <div class=\"section\">\n" +
    "            <div class=\"test-score-title\">{{::$ctrl.testScoreTitle}}</div>\n" +
    "            <div class=\"gauge-row-wrapper\">\n" +
    "                <div class=\"overflowWrap\">\n" +
    "                    <div class=\"gauge-wrap\">\n" +
    "                        <div class=\"gauge-inner-text\">{{::$ctrl.performanceChart.successRate}}%\n" +
    "                            <div class=\"success-title\" translate=\".SUCCESS\"></div>\n" +
    "                        </div>\n" +
    "                        <canvas width=\"134\"\n" +
    "                                height=\"134\"\n" +
    "                                id=\"doughnut\"\n" +
    "                                class=\"chart chart-doughnut\"\n" +
    "                                chart-options=\"$ctrl.performanceChart.gaugeSettings.options\"\n" +
    "                                chart-colours=\"$ctrl.performanceChart.gaugeSettings.colours\"\n" +
    "                                chart-data=\"$ctrl.performanceChart.gaugeSettings.data\"\n" +
    "                                chart-labels=\"$ctrl.performanceChart.gaugeSettings.labels\"\n" +
    "                                chart-legend=\"false\">\n" +
    "                        </canvas>\n" +
    "                    </div>\n" +
    "                    <div class=\"statistics\">\n" +
    "                        <div class=\"stat-row\">\n" +
    "                            <div class=\"stat-val correct\">{{::$ctrl.exerciseResult.correctAnswersNum}}</div>\n" +
    "                            <div class=\"title\" translate=\".CORRECT\"></div>\n" +
    "                            <div class=\"avg-score\">\n" +
    "                            <span translate=\".AVG_TIME\"\n" +
    "                                  translate-values=\"{\n" +
    "                                    avgTime: $ctrl.statsTime.correctAvgTime\n" +
    "                                  }\">\n" +
    "                            </span>\n" +
    "                            </div>\n" +
    "                        </div>\n" +
    "                        <div class=\"stat-row\">\n" +
    "                            <div class=\"stat-val wrong\">{{::$ctrl.exerciseResult.wrongAnswersNum}}</div>\n" +
    "                            <div class=\"title\" translate=\".WRONG\"></div>\n" +
    "                            <div class=\"avg-score\">\n" +
    "                            <span translate=\".AVG_TIME\"\n" +
    "                                  translate-values=\"{\n" +
    "                                    avgTime: $ctrl.statsTime.wrongAvgTime\n" +
    "                                  }\">\n" +
    "                            </span>\n" +
    "                            </div>\n" +
    "                        </div>\n" +
    "                        <div class=\"stat-row\">\n" +
    "                            <div class=\"stat-val skipped\">{{::$ctrl.exerciseResult.skippedAnswersNum}}</div>\n" +
    "                            <div class=\"title\" translate=\".SKIPPED\"></div>\n" +
    "                            <div class=\"avg-score\">\n" +
    "                            <span translate=\".AVG_TIME\"\n" +
    "                                  translate-values=\"{\n" +
    "                                    avgTime: $ctrl.statsTime.skippedAvgTime\n" +
    "                                  }\">\n" +
    "                            </span>\n" +
    "                            </div>\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "                </div>\n" +
    "\n" +
    "                <div class=\"category-name\">{{$ctrl.categoryName | cutString: 42}}</div>\n" +
    "            </div>\n" +
    "            <div class=\"review-btn-wrapper\">\n" +
    "                <md-button class=\"md-primary znk\"\n" +
    "                           aria-label=\"{{'COMPLETE_EXERCISE_SAT.COMPLETE_EXERCISE_SUMMARY.REVIEW' | translate}}\"\n" +
    "                           tabindex=\"1\"\n" +
    "                           md-no-ink\n" +
    "                           ng-cloak\n" +
    "                           ng-click=\"$ctrl.goToSummary()\">\n" +
    "                    <span translate=\".REVIEW\"></span>\n" +
    "                </md-button>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "        <div class=\"section time-line-wrapper2\"\n" +
    "                 ng-if=\"!$ctrl.isEssaySubject\"\n" +
    "                 ng-class=\"{\n" +
    "                'seen-summary': $ctrl.seenSummary\n" +
    "             }\">\n" +
    "        <div class=\"estimated-score-title\">\n" +
    "            <span translate=\"COMPLETE_EXERCISE.SUBJECTS.{{$ctrl.exerciseResult.subjectId}}\"></span>\n" +
    "            <span translate=\".ESTIMATED_SCORE\"></span></div>\n" +
    "        <performance-timeline\n" +
    "            on-timeline-finish=\"$ctrl.onTimelineFinish(subjectDelta)\"\n" +
    "            subject-id=\"{{::$ctrl.exerciseResult.subjectId}}\"\n" +
    "            show-induction=\"true\"\n" +
    "            active-exercise-id=\"::$ctrl.exerciseContent.id\">\n" +
    "        </performance-timeline>\n" +
    "    </div>\n" +
    "        <div class=\"section proficiency-level-row animate-if\" ng-if=\"$ctrl.notSeenSummary\">\n" +
    "            <div class=\"proficiency-title-row\" translate=\".MASTERY_LEVEL\"></div>\n" +
    "            <div class=\"row data-row\">\n" +
    "                <div class=\"subject-level\">\n" +
    "                    <div class=\"test-score-name\">{{::$ctrl.testScoreMastery.testScorename}}</div>\n" +
    "                    <div class=\"subject-progress\">\n" +
    "                        <div class=\"progress\">\n" +
    "                            <div znk-progress-bar progress-width=\"{{::$ctrl.testScoreMastery.progress}}\"\n" +
    "                                 show-progress-value=\"false\"></div>\n" +
    "                            <div class=\"title\" translate=\".MASTERY\"></div>\n" +
    "                        </div>\n" +
    "                        <div class=\"progress-val\">\n" +
    "                            {{::$ctrl.testScoreMastery.progress}}%\n" +
    "                            <div class=\"progress-perfect\"\n" +
    "                                 ng-class=\"{\n" +
    "                                'bad-score': $ctrl.testScoreDelta<0\n" +
    "                             }\"\n" +
    "                                 ng-if=\"$ctrl.testScoreDelta != 0\">\n" +
    "                                <span ng-if=\"$ctrl.testScoreDelta > 0\">+</span>\n" +
    "                                {{$ctrl.testScoreDelta | number : 0}}\n" +
    "                            </div>\n" +
    "                        </div>\n" +
    "\n" +
    "                    </div>\n" +
    "                </div>\n" +
    "                <div class=\"category-level-wrap\">\n" +
    "                    <div class=\"category-level\" ng-repeat=\"(key, category) in $ctrl.categoryMastery\">\n" +
    "                        <div class=\"category-data\">\n" +
    "                            <div class=\"category-level-name\">{{category.name}}</div>\n" +
    "                            <div znk-progress-bar progress-width=\"{{category.progress}}\"\n" +
    "                                 progress-value=\"{{category.progress}}\" show-progress-value=\"false\"></div>\n" +
    "                            <div class=\"level\">{{category.mastery}}</div>\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
  $templateCache.put("components/completeExerciseSat/directives/socialSharing/socialSharing.template.html",
    "<div class=\"social-sharing-drv-container\"\n" +
    "     ng-class=\"[vm.showSocialArea.background, vm.animate ? 'social-sharing-drv-container-animate' : '']\"\n" +
    "     ng-if=\"vm.showSocialArea\"\n" +
    "     translate-namespace=\"SOCIAL_SHARING_CONTAINER_DRV\">\n" +
    "    <div class=\"decor\" ng-class=\"vm.showSocialArea.banner1\"></div>\n" +
    "    <div class=\"share-main-container\" ng-switch on=\"vm.showSocialArea.isImproved\">\n" +
    "        <div class=\"social-sharing-title\" translate=\".TITLE\"></div>\n" +
    "        <div class=\"social-text\"\n" +
    "             translate=\".POINTS_TEXT\"\n" +
    "             ng-switch-when=\"false\"\n" +
    "             translate-values=\"{ pts: {{vm.showSocialArea.realPoints}}, subjectName: '{{vm.subjectName}}' }\">\n" +
    "        </div>\n" +
    "        <div class=\"social-text\"\n" +
    "             translate=\".IMPROVED_TEXT\"\n" +
    "             ng-switch-when=\"true\"\n" +
    "             translate-values=\"{ pts: {{vm.showSocialArea.realPoints}}, subjectName: '{{vm.subjectName}}' }\">\n" +
    "        </div>\n" +
    "        <social-share-btn-drv share-data=\"vm.shareData\"></social-share-btn-drv>\n" +
    "    </div>\n" +
    "    <div class=\"decor\" ng-class=\"vm.showSocialArea.banner2\"></div>\n" +
    "</div>\n" +
    "");
  $templateCache.put("components/completeExerciseSat/svg/correct-icon.svg",
    "<svg version=\"1.1\"\n" +
    "     class=\"correct-icon-svg\"\n" +
    "     x=\"0px\"\n" +
    "     y=\"0px\"\n" +
    "	 viewBox=\"0 0 188.5 129\">\n" +
    "<style type=\"text/css\">\n" +
    "	.correct-icon-svg .st0 {\n" +
    "        fill: none;\n" +
    "        stroke: #231F20;\n" +
    "        stroke-width: 15;\n" +
    "        stroke-linecap: round;\n" +
    "        stroke-linejoin: round;\n" +
    "        stroke-miterlimit: 10;\n" +
    "    }\n" +
    "    .correct-icon-svg {\n" +
    "        width: 100%;\n" +
    "        height: auto;\n" +
    "    }\n" +
    "</style>\n" +
    "<g>\n" +
    "	<line class=\"st0\" x1=\"7.5\" y1=\"62\" x2=\"67\" y2=\"121.5\"/>\n" +
    "	<line class=\"st0\" x1=\"67\" y1=\"121.5\" x2=\"181\" y2=\"7.5\"/>\n" +
    "</g>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/completeExerciseSat/svg/wrong-icon.svg",
    "<svg version=\"1.1\"\n" +
    "     class=\"wrong-icon-svg\"\n" +
    "     xmlns=\"http://www.w3.org/2000/svg\"\n" +
    "     xmlns:xlink=\"http://www.w3.org/1999/xlink\"\n" +
    "     x=\"0px\"\n" +
    "     y=\"0px\"\n" +
    "	 viewBox=\"0 0 126.5 126.5\"\n" +
    "     style=\"enable-background:new 0 0 126.5 126.5;\"\n" +
    "     xml:space=\"preserve\">\n" +
    "<style type=\"text/css\">\n" +
    "	.wrong-icon-svg .st0 {\n" +
    "        fill: none;\n" +
    "        stroke: #231F20;\n" +
    "        stroke-width: 15;\n" +
    "        stroke-linecap: round;\n" +
    "        stroke-linejoin: round;\n" +
    "        stroke-miterlimit: 10;\n" +
    "    }\n" +
    "</style>\n" +
    "<g>\n" +
    "	<line class=\"st0\" x1=\"119\" y1=\"7.5\" x2=\"7.5\" y2=\"119\"/>\n" +
    "	<line class=\"st0\" x1=\"7.5\" y1=\"7.5\" x2=\"119\" y2=\"119\"/>\n" +
    "</g>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/completeExerciseSat/templates/article.template.html",
    "<div class=\"article-line-numbers\"></div>\n" +
    "    <div class=\"article-content\"></div>\n" +
    "\n" +
    "");
  $templateCache.put("components/completeExerciseSat/templates/customAnswerBuilderSat.template.html",
    "<div class=\"instructions-title-wrapper\" ng-if=\"d.showFreeTextInstructions\" translate-namespace=\"CUSTOM_ANSWER_BUILDER_SAT\">\n" +
    "    <div class=\"instructions-title\">\n" +
    "        <span translate=\".FREE_TEXT_INSTRUCTIONS\"></span>\n" +
    "        <div class=\"svg-wrapper\">\n" +
    "            <svg-icon name=\"info-icon\"></svg-icon>\n" +
    "            <md-tooltip md-direction=\"top\" class=\"free-text-instructions-tooltip\">\n" +
    "                <span translate=\".FREE_TEXT_INSTRUCTIONS_TOOLTIP\"></span>\n" +
    "                <div class=\"arrow-down\"></div>\n" +
    "            </md-tooltip>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "    <div class=\"note-title\" translate=\".FREE_TEXT_NOTICE\"></div>\n" +
    "</div>\n" +
    "<answer-builder> </answer-builder>\n" +
    "");
  $templateCache.put("components/completeExerciseSat/templates/essayQuestion.template.html",
    "<div class=\"question-wrapper writing-question-wrapper question-basic-style\">\n" +
    "\n" +
    "    <div class=\"question-container znk-scrollbar\" znk-exercise-draw-container canvas-name=\"question\"></div>\n" +
    "\n" +
    "    <div class=\"answer-container znk-scrollbar\" znk-exercise-draw-container canvas-name=\"answer\">\n" +
    "        <div class=\"question-content\"></div>\n" +
    "        <answer-builder></answer-builder>\n" +
    "    </div>\n" +
    "\n" +
    "</div>\n" +
    "");
  $templateCache.put("components/completeExerciseSat/templates/freeTextAnswer.template.html",
    "<div class=\"free-text-answer-wrapper\"\n" +
    "     ng-switch=\"showCorrectAnswer\"\n" +
    "     translate-namespace=\"FREE_TEXT_ANSWER\">\n" +
    "\n" +
    "    <div ng-switch-when=\"true\" class=\"answer-status-wrapper\" ng-class=\"userAnswerStatus\">\n" +
    "        <div class=\"answer-status\">\n" +
    "            <div class=\"user-answer\">{{d.userAnswer}}</div>\n" +
    "            <svg-icon class=\"wrong-icon\" name=\"complete-exercise-wrong-icon\"></svg-icon>\n" +
    "        </div>\n" +
    "        <div class=\"correct-answer\">\n" +
    "            <span translate=\".CORRECT_ANSWER\"></span>\n" +
    "            <span>{{correctAnswer}}</span>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "\n" +
    "    <div  ng-switch-when=\"false\" class=\"input-wrapper\">\n" +
    "        <input ng-model-options=\"{ getterSetter: true }\" ng-model=\"d.userAnswerGetterSetter\">\n" +
    "        <div class=\"arrow-wrapper\" ng-click=\"clickHandler()\">\n" +
    "            <svg-icon name=\"arrow-icon\"></svg-icon>\n" +
    "            <div class=\"svg-back\"></div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "\n" +
    "</div>\n" +
    "");
  $templateCache.put("components/completeExerciseSat/templates/lectureQuestion.template.html",
    "<div class=\"lecture-question-wrapper\" ng-switch=\"vm.question.typeId\" znk-exercise-draw-container canvas-name=\"question\">\n" +
    "    <div class=\"img-wrapper\" ng-switch-when=\"1\">\n" +
    "        <img  ng-src=\"{{vm.question.fileUrl}}\">\n" +
    "    </div>\n" +
    "    <!--<div ng-switch-when=\"1\"> wait for the second type</div> -->\n" +
    "</div>\n" +
    "");
  $templateCache.put("components/completeExerciseSat/templates/mathQuestion.template.html",
    "<div class=\"math-question-wrapper\" image-zoomer>\n" +
    "\n" +
    "    <div class=\"question-container\" znk-exercise-draw-container canvas-name=\"question\"></div>\n" +
    "\n" +
    "    <div class=\"answer-container znk-scrollbar\" znk-exercise-draw-container canvas-name=\"answer\">\n" +
    "        <div class=\"answer-content\"></div>\n" +
    "        <custom-answer-builder-sat></custom-answer-builder-sat>\n" +
    "    </div>\n" +
    "\n" +
    "</div>\n" +
    "");
  $templateCache.put("components/completeExerciseSat/templates/rateAnswer.template.html",
    "<div class=\"rate-answer-wrapper\">\n" +
    "    <div class=\"checkbox-items-wrapper\" >\n" +
    "        <div class=\"item-repeater\" ng-repeat=\"item in d.itemsArray track by $index\">\n" +
    "            <svg-icon class=\"correct-icon\" name=\"complete-exercise-correct-icon\"></svg-icon>\n" +
    "            <svg-icon class=\"wrong-icon\" name=\"complete-exercise-wrong-icon\"></svg-icon>\n" +
    "            <div class=\"checkbox-item\" ng-click=\"clickHandler($index)\">\n" +
    "                <div class=\"item-index\">{{$index +  2}}</div>\n" +
    "            </div>\n" +
    "            <div class=\"correct-answer-line\"></div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
  $templateCache.put("components/completeExerciseSat/templates/readingQuestion.template.html",
    "<div class=\"question-wrapper reading-question-wrapper question-basic-style\" image-zoomer>\n" +
    "\n" +
    "    <div class=\"question-container znk-scrollbar\" znk-exercise-draw-container canvas-name=\"question\">\n" +
    "        <div class=\"passage-title\">{{::vm.passageTitle}}</div>\n" +
    "        <div class=\"article\">\n" +
    "            <div class=\"article-content\"></div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"answer-container znk-scrollbar\" znk-exercise-draw-container canvas-name=\"answer\">\n" +
    "        <div class=\"question-content\"></div>\n" +
    "        <answer-builder></answer-builder>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
  $templateCache.put("components/completeExerciseSat/templates/selectAnswer.template.html",
    "<div ng-repeat=\"answer in ::d.answers track by answer.id\"\n" +
    "     class=\"answer\"\n" +
    "     ng-click=\"d.click(answer)\"\n" +
    "     tabindex=\"-1\">\n" +
    "    <div class=\"content-wrapper\">\n" +
    "        <div class=\"answer-index-wrapper\">\n" +
    "            <span class=\"index-char\">{{::d.getIndexChar($index)}}</span>\n" +
    "        </div>\n" +
    "        <markup content=\"answer.content\" type=\"md\" class=\"content\"></markup>\n" +
    "        <svg-icon class=\"correct-icon-drv\" name=\"complete-exercise-correct-icon\"></svg-icon>\n" +
    "        <svg-icon class=\"wrong-icon-drv\" name=\"complete-exercise-wrong-icon\"></svg-icon>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
  $templateCache.put("components/completeExerciseSat/templates/simpleQuestion.template.html",
    "<div class=\"question-wrapper simple-question-wrapper question-basic-style\" image-zoomer>\n" +
    "        <div class=\"answer-container znk-scrollbar\" znk-exercise-draw-container canvas-name=\"answer\">\n" +
    "            <div class=\"question-content\"></div>\n" +
    "            <custom-answer-builder-sat></custom-answer-builder-sat>\n" +
    "        </div>\n" +
    "</div>\n" +
    "");
  $templateCache.put("components/completeExerciseSat/templates/writingFullPassage.template.html",
    "<div class=\"question-wrapper english-full-paragraphs-wrapper question-basic-style\" image-zoomer>\n" +
    "    <div class=\"question-container znk-scrollbar\" znk-exercise-draw-container canvas-name=\"question\">\n" +
    "        <div class=\"paragraph-title\"></div>\n" +
    "        <div class=\"paragraphs-wrapper\"></div>\n" +
    "    </div>\n" +
    "    <div class=\"answer-container znk-scrollbar\" znk-exercise-draw-container canvas-name=\"answer\">\n" +
    "        <div class=\"question-content\"></div>\n" +
    "        <answer-builder></answer-builder>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
  $templateCache.put("components/completeExerciseSat/templates/writingSpecificParagraph.template.html",
    "<div class=\"question-wrapper writing-specific-paragraph-wrapper question-basic-style\" translate-namespace=\"WRITING_SPECIFIC_PARAGRAPH\">\n" +
    "\n" +
    "    <div class=\"specific-paragraph-view-wrapper\" ng-show=\"vm.view === vm.SPECIFIC_PARAGRAPH\" image-zoomer>\n" +
    "        <div class=\"question-container znk-scrollbar\" znk-exercise-draw-container canvas-name=\"question\">\n" +
    "            <div class=\"full-passage-link\" ng-bind-html=\"vm.question.groupData.name\" ng-click=\"vm.view = vm.FULL_PASSAGE\"></div>\n" +
    "            <div class=\"paragraph-title\"></div>\n" +
    "            <div class=\"paragraph\"></div>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"answer-container znk-scrollbar\" znk-exercise-draw-container canvas-name=\"answer\">\n" +
    "            <div class=\"question-content\"></div>\n" +
    "            <answer-builder></answer-builder>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"full-passage-view-wrapper \" ng-show=\"vm.view === vm.FULL_PASSAGE\" image-zoomer>\n" +
    "\n" +
    "        <div class=\"passage-title\">\n" +
    "            <div ng-bind-html=\"vm.question.groupData.name\"></div>\n" +
    "            <div class=\"back-to-question-link\" ng-click=\"vm.view = vm.SPECIFIC_PARAGRAPH\">\n" +
    "                <i class=\"material-icons chevron-left\">chevron_left</i>\n" +
    "                <div class=\"back-to-question\" translate=\".BACK_TO_QUESTION\"></div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"full-passage-wrapper znk-scrollbar\">\n" +
    "            <div class=\"full-passage\"></div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
}]);

(function (angular) {
    'use strict';

    angular.module('znk.infra-sat.configSat', [
        'znk.infra.exerciseUtility'
    ]);
})(angular);

(function () {
    'use strict';

    angular.module('znk.infra-sat.configSat')
        .decorator('CategoryService', ["$delegate", "$q", "EnumSrv", "categoryEnum", function ($delegate, $q, EnumSrv, categoryEnum) {
            'ngInject';

            var categoryService = $delegate;


            categoryService.getSubjectIdByCategory = function (category) {
                if (category.typeId === categoryEnum.LEVEL1.enum) {
                    return $q.when(category.id);
                }
                return categoryService.getParentCategory(category.id).then(function (parentCategory) {
                    return categoryService.getSubjectIdByCategory(parentCategory);
                });
            };

            categoryService.getTestScore = function (categoryId) {
                return categoryService.getCategoryMap().then(function (categories) {
                    var category = categories[categoryId];
                    if (category.typeId === categoryEnum.LEVEL2.enum) {
                        return category;
                    }
                    return categoryService.getTestScore(category.parentId);
                });
            };

            categoryService.getAllGeneralCategories = (function () {
                var getAllGeneralCategoriesProm;
                return function () {
                    if (!getAllGeneralCategoriesProm) {
                        getAllGeneralCategoriesProm = categoryService.getCategoryMap().then(function (categories) {
                            var generalCategories = {};
                            angular.forEach(categories, function (category) {
                                if (category.typeId === categoryEnum.LEVEL3.enum) {
                                    generalCategories[category.id] = category;
                                }
                            });
                            return generalCategories;
                        });
                    }
                    return getAllGeneralCategoriesProm;
                };
            })();

            categoryService.getAllGeneralCategoriesBySubjectId = (function () {
                var getAllGeneralCategoriesBySubjectIdProm;
                return function (subjectId) {
                    if (!getAllGeneralCategoriesBySubjectIdProm) {
                        getAllGeneralCategoriesBySubjectIdProm = categoryService.getAllGeneralCategories().then(function (categories) {
                            var generalCategories = {};
                            var promArray = [];
                            angular.forEach(categories, function (generalCategory) {
                                var prom = categoryService.getSubjectIdByCategory(generalCategory).then(function (currentCategorySubjectId) {
                                    if (currentCategorySubjectId === subjectId) {
                                        generalCategories[generalCategory.id] = generalCategory;
                                    }
                                });
                                promArray.push(prom);
                            });
                            return $q.all(promArray).then(function () {
                                return generalCategories;
                            });
                        });
                    }
                    return getAllGeneralCategoriesBySubjectIdProm;
                };
            })();

            categoryService.getAllSpecificCategories = (function () {
                var getAllSpecificCategoriesProm;
                return function () {
                    if (!getAllSpecificCategoriesProm) {
                        getAllSpecificCategoriesProm = categoryService.getCategoryMap().then(function (categories) {
                            var specificCategories = {};
                            angular.forEach(categories, function (category) {
                                if (category.typeId === categoryEnum.LEVEL4.enum) {
                                    specificCategories[category.id] = category;
                                }
                            });
                            return specificCategories;
                        });
                    }
                    return getAllSpecificCategoriesProm;
                };
            })();

            categoryService.getAllGeneralCategoriesBySubjectId = (function () {
                var getAllGeneralCategoriesBySubjectIdProm;
                return function (subjectId) {
                    if (!getAllGeneralCategoriesBySubjectIdProm) {
                        getAllGeneralCategoriesBySubjectIdProm = categoryService.getAllGeneralCategories().then(function (categories) {
                            var generalCategories = {};
                            var promArray = [];
                            angular.forEach(categories, function (generalCategory) {
                                var prom = categoryService.getSubjectIdByCategory(generalCategory).then(function (currentCategorySubjectId) {
                                    if (currentCategorySubjectId === subjectId) {
                                        generalCategories[generalCategory.id] = generalCategory;
                                    }
                                });
                                promArray.push(prom);
                            });
                            return $q.all(promArray).then(function () {
                                return generalCategories;
                            });
                        });
                    }
                    return getAllGeneralCategoriesBySubjectIdProm;
                };
            })();

            categoryService.getSubjectIdByCategory = function (category) {
                if (category.typeId === categoryEnum.LEVEL1.enum) {
                    return $q.when(category.id);
                }
                return categoryService.getParentCategory(category.id).then(function (parentCategory) {
                    return categoryService.getSubjectIdByCategory(parentCategory);
                });
            };

            return categoryService;
        }]);
})();

(function () {
    'use strict';

    angular.module('znk.infra-sat.configSat')
        .decorator('EstimatedScoreSrv', ["$delegate", "ScoringService", function ($delegate, ScoringService) {
            'ngInject';
            var estimatedScoreSrv = $delegate;

            estimatedScoreSrv.getCompositeScore = function () {    // todo: delete this fn?
                return $delegate.getLatestEstimatedScore().then(function (estimatedScores) {
                    var scoresArr = [];
                    angular.forEach(estimatedScores, function (estimatesScoreForSubject) {
                        scoresArr.push(estimatesScoreForSubject.score || 0);
                    });
                    return ScoringService.getTotalScoreResult(scoresArr);
                });
            };

            return estimatedScoreSrv;
        }]);
})();

(function () {
    'use strict';

    angular.module('znk.infra-sat.configSat')
        .decorator('SubjectEnum', ["$delegate", function ($delegate) {
            'ngInject';

            var relevantSubjects = ['MATH', 'VERBAL', 'ESSAY'];
            angular.forEach($delegate, function (value, key) {
                if (relevantSubjects.indexOf(key) === -1) {
                    delete $delegate[key];
                }
            });
            return $delegate;
        }]);
})();

angular.module('znk.infra-sat.configSat').run(['$templateCache', function($templateCache) {
  $templateCache.put("components/configSat/svg/znk-app-name-logo.svg",
    "<svg version=\"1.1\" id=\"SAT\" xmlns=\"http://www.w3.org/2000/svg\" x=\"0px\" y=\"0px\" viewBox=\"-187 363 236 67\" class=\"znk-app-name-logo\">\n" +
    "<style type=\"text/css\">\n" +
    "	.znk-app-name-logo .st0{enable-background:new    ;}\n" +
    "    .znk-app-name-logo .st1{fill:#0A9BAD;}\n" +
    "    .znk-app-name-logo .st2{fill:#A1A1A1;}\n" +
    "    .znk-app-name-logo .st3{fill:none;enable-background:new    ;}\n" +
    "    .znk-app-name-logo .st4{fill:#000001;}\n" +
    "</style>\n" +
    "<g class=\"st0\">\n" +
    "	<path class=\"st1\" d=\"M-58.4,370.8c-2,0-3.6,0.4-4.9,1.2s-1.9,2-1.9,3.6c0,1.6,0.6,2.8,1.9,3.6c1.3,0.8,4,1.7,8.1,2.7\n" +
    "		c4.1,1,7.2,2.3,9.3,4.1c2.1,1.8,3.1,4.3,3.1,7.8c0,3.4-1.3,6.2-4,8.3c-2.7,2.1-6.1,3.2-10.4,3.2c-6.3,0-11.9-2.1-16.8-6.3l4.3-5\n" +
    "		c4.1,3.4,8.3,5.2,12.7,5.2c2.2,0,3.9-0.5,5.2-1.4c1.3-0.9,1.9-2.1,1.9-3.6s-0.6-2.7-1.8-3.5c-1.2-0.8-3.3-1.6-6.3-2.3\n" +
    "		c-3-0.7-5.2-1.3-6.7-1.9c-1.5-0.6-2.9-1.3-4.1-2.3c-2.4-1.8-3.6-4.4-3.6-8.1c0-3.6,1.4-6.4,4.1-8.4c2.7-2,6.1-2.9,10.1-2.9\n" +
    "		c2.6,0,5.1,0.4,7.7,1.2c2.5,0.8,4.7,2,6.6,3.5l-3.6,5c-1.2-1-2.8-1.9-4.8-2.6C-54.4,371.2-56.5,370.8-58.4,370.8z\"/>\n" +
    "	<path class=\"st1\" d=\"M-29,395.9l-4,8.9h-7.3l17.8-39.2h7.3l17.8,39.2h-7.3l-4-8.9H-29z M-11.6,389.8l-7.3-16.1l-7.3,16.1H-11.6z\"/>\n" +
    "	<path class=\"st1\" d=\"M20.1,371.7v33.1h-6.8v-33.1H1.1v-6.1h31.3v6.1H20.1z\"/>\n" +
    "</g>\n" +
    "<path class=\"st1\" d=\"M42.4,363c3.4-0.2,6.4,2.4,6.6,5.9s-2.4,6.4-5.9,6.6c-0.2,0-0.5,0-0.7,0c-3.4,0.2-6.4-2.4-6.7-5.8\n" +
    "	c-0.2-3.4,2.4-6.4,5.8-6.7C41.8,363,42.1,363,42.4,363L42.4,363z M42.3,364.3c-2.7,0-4.9,2.3-4.9,5c0,2.7,2.3,4.9,5,4.9\n" +
    "	c2.7,0,4.9-2.1,4.9-4.8c0-0.1,0-0.1,0-0.2c0-2.7-2.1-5-4.8-5C42.4,364.3,42.4,364.3,42.3,364.3L42.3,364.3L42.3,364.3z M41.3,372.4\n" +
    "	h-1.5v-6.2c0.8-0.1,1.7-0.2,2.5-0.2c0.8-0.1,1.5,0.1,2.2,0.5c0.4,0.3,0.7,0.8,0.7,1.3c-0.1,0.7-0.6,1.3-1.3,1.5v0.1\n" +
    "	c0.6,0.2,1.1,0.8,1.1,1.5c0.1,0.5,0.2,1,0.5,1.5h-1.6c-0.3-0.5-0.4-1-0.5-1.5c-0.1-0.6-0.7-1-1.3-1c0,0,0,0-0.1,0h-0.7L41.3,372.4\n" +
    "	L41.3,372.4z M41.4,369h0.7c0.8,0,1.5-0.3,1.5-0.9c0-0.6-0.4-0.9-1.4-0.9c-0.3,0-0.6,0-0.8,0.1L41.4,369L41.4,369z\"/>\n" +
    "<g class=\"st0\">\n" +
    "	<path class=\"st2\" d=\"M-57,417v1.5h-4.2V430H-63v-11.5h-4.2V417H-57z\"/>\n" +
    "	<path class=\"st2\" d=\"M-47.2,417v1.4h-6.2v4.3h5v1.4h-5v4.4h6.2v1.4h-8v-13H-47.2z\"/>\n" +
    "	<path class=\"st2\" d=\"M-38,419.1c-0.1,0.1-0.1,0.2-0.2,0.2c-0.1,0-0.1,0.1-0.2,0.1c-0.1,0-0.2-0.1-0.4-0.2s-0.3-0.2-0.5-0.3\n" +
    "		c-0.2-0.1-0.5-0.2-0.8-0.3s-0.6-0.2-1.1-0.2c-0.4,0-0.7,0.1-1,0.2c-0.3,0.1-0.6,0.2-0.8,0.4c-0.2,0.2-0.4,0.4-0.5,0.6\n" +
    "		c-0.1,0.2-0.2,0.5-0.2,0.8c0,0.4,0.1,0.7,0.3,0.9c0.2,0.2,0.4,0.4,0.7,0.6c0.3,0.2,0.6,0.3,1,0.4c0.4,0.1,0.8,0.3,1.1,0.4\n" +
    "		c0.4,0.1,0.8,0.3,1.1,0.4c0.4,0.2,0.7,0.4,1,0.6c0.3,0.3,0.5,0.6,0.7,0.9c0.2,0.4,0.3,0.8,0.3,1.4c0,0.6-0.1,1.1-0.3,1.6\n" +
    "		c-0.2,0.5-0.5,0.9-0.8,1.3c-0.4,0.4-0.8,0.7-1.4,0.9s-1.2,0.3-1.8,0.3c-0.8,0-1.6-0.2-2.3-0.5c-0.7-0.3-1.3-0.7-1.8-1.2l0.5-0.8\n" +
    "		c0-0.1,0.1-0.1,0.2-0.2c0.1,0,0.1-0.1,0.2-0.1c0.1,0,0.3,0.1,0.4,0.2s0.4,0.3,0.6,0.4s0.5,0.3,0.9,0.4c0.3,0.1,0.8,0.2,1.3,0.2\n" +
    "		c0.4,0,0.8-0.1,1.1-0.2s0.6-0.3,0.8-0.5c0.2-0.2,0.4-0.5,0.5-0.7c0.1-0.3,0.2-0.6,0.2-1c0-0.4-0.1-0.7-0.3-1s-0.4-0.5-0.7-0.6\n" +
    "		c-0.3-0.2-0.6-0.3-1-0.4c-0.4-0.1-0.8-0.2-1.1-0.4c-0.4-0.1-0.8-0.3-1.1-0.4s-0.7-0.4-1-0.6c-0.3-0.3-0.5-0.6-0.7-1\n" +
    "		s-0.3-0.9-0.3-1.4c0-0.5,0.1-0.9,0.3-1.3s0.4-0.8,0.8-1.1s0.8-0.6,1.3-0.8s1.1-0.3,1.7-0.3c0.7,0,1.4,0.1,2,0.3\n" +
    "		c0.6,0.2,1.1,0.6,1.6,1L-38,419.1z\"/>\n" +
    "	<path class=\"st2\" d=\"M-26.2,417v1.5h-4.2V430h-1.8v-11.5h-4.2V417H-26.2z\"/>\n" +
    "	<path class=\"st2\" d=\"M-19,425.2v4.8h-1.7v-13h3.8c0.8,0,1.5,0.1,2.1,0.3c0.6,0.2,1.1,0.5,1.5,0.8s0.7,0.8,0.9,1.3s0.3,1,0.3,1.7\n" +
    "		c0,0.6-0.1,1.2-0.3,1.7c-0.2,0.5-0.5,0.9-0.9,1.3c-0.4,0.4-0.9,0.6-1.5,0.8s-1.3,0.3-2.1,0.3H-19z M-19,423.8h2.1\n" +
    "		c0.5,0,0.9-0.1,1.3-0.2c0.4-0.1,0.7-0.3,1-0.6c0.3-0.2,0.5-0.5,0.6-0.9c0.1-0.3,0.2-0.7,0.2-1.1c0-0.8-0.3-1.5-0.8-1.9\n" +
    "		c-0.5-0.5-1.3-0.7-2.3-0.7H-19V423.8z\"/>\n" +
    "	<path class=\"st2\" d=\"M-7.9,424.6v5.4h-1.7v-13H-6c0.8,0,1.5,0.1,2.1,0.2c0.6,0.2,1.1,0.4,1.5,0.7c0.4,0.3,0.7,0.7,0.9,1.1\n" +
    "		s0.3,0.9,0.3,1.5c0,0.5-0.1,0.9-0.2,1.3c-0.1,0.4-0.4,0.8-0.6,1.1s-0.6,0.6-1,0.8c-0.4,0.2-0.8,0.4-1.3,0.5\n" +
    "		c0.2,0.1,0.4,0.3,0.6,0.6l3.8,5.1h-1.6c-0.3,0-0.6-0.1-0.7-0.4l-3.4-4.6c-0.1-0.1-0.2-0.2-0.3-0.3c-0.1-0.1-0.3-0.1-0.5-0.1H-7.9z\n" +
    "		 M-7.9,423.3h1.8c0.5,0,1-0.1,1.4-0.2c0.4-0.1,0.7-0.3,1-0.5c0.3-0.2,0.5-0.5,0.6-0.8s0.2-0.7,0.2-1c0-0.8-0.3-1.4-0.8-1.7\n" +
    "		c-0.5-0.4-1.3-0.6-2.3-0.6h-1.9V423.3z\"/>\n" +
    "	<path class=\"st2\" d=\"M9.8,417v1.4H3.6v4.3h5v1.4h-5v4.4h6.2v1.4h-8v-13H9.8z\"/>\n" +
    "	<path class=\"st2\" d=\"M14.2,425.2v4.8h-1.7v-13h3.8c0.8,0,1.5,0.1,2.1,0.3c0.6,0.2,1.1,0.5,1.5,0.8s0.7,0.8,0.9,1.3s0.3,1,0.3,1.7\n" +
    "		c0,0.6-0.1,1.2-0.3,1.7c-0.2,0.5-0.5,0.9-0.9,1.3c-0.4,0.4-0.9,0.6-1.5,0.8s-1.3,0.3-2.1,0.3H14.2z M14.2,423.8h2.1\n" +
    "		c0.5,0,0.9-0.1,1.3-0.2c0.4-0.1,0.7-0.3,1-0.6c0.3-0.2,0.5-0.5,0.6-0.9c0.1-0.3,0.2-0.7,0.2-1.1c0-0.8-0.3-1.5-0.8-1.9\n" +
    "		c-0.5-0.5-1.3-0.7-2.3-0.7h-2.1V423.8z\"/>\n" +
    "</g>\n" +
    "<path class=\"st3\"/>\n" +
    "<circle id=\"XMLID_137_\" class=\"st4\" cx=\"-115.5\" cy=\"402.6\" r=\"5.7\"/>\n" +
    "<path id=\"XMLID_136_\" class=\"st4\" d=\"M-138.9,428.6c4.2,0,7.7-3.4,7.7-7.7c0-4.2-3.4-7.7-7.7-7.7c-4.2,0-7.7,3.4-7.7,7.7\n" +
    "	C-146.6,425.1-143.1,428.6-138.9,428.6z\"/>\n" +
    "<path id=\"XMLID_135_\" class=\"st4\" d=\"M-116.6,392c-6.5-4-14.2-6.3-22.3-6.3c-8.1,0-15.8,2.3-22.3,6.3c5.4,0.5,9.6,5.1,9.6,10.6\n" +
    "	c0,0.7-0.1,1.4-0.2,2.1c3.9-2.1,8.3-3.3,13-3.3c4.7,0,9.1,1.2,13,3.3c-0.1-0.7-0.2-1.4-0.2-2.1C-126.2,397.1-122,392.6-116.6,392z\"\n" +
    "	/>\n" +
    "<path id=\"XMLID_134_\" class=\"st4\" d=\"M-172.9,402.8c-3.3,4.5-5.8,9.7-7.2,15.4c-0.5,2-0.2,4.1,0.9,5.9c1.1,1.8,2.8,3,4.8,3.5\n" +
    "	c0.6,0.1,1.2,0.2,1.8,0.2c3.6,0,6.8-2.5,7.6-6c0.8-3.2,2.1-6.1,3.8-8.6c-0.4,0-0.8,0.1-1.2,0.1\n" +
    "	C-168.1,413.2-172.8,408.6-172.9,402.8z\"/>\n" +
    "<path id=\"XMLID_132_\" class=\"st4\" d=\"M-91.9,402.4c0.2-2.8,2.7-32.3-1.9-36.6c-3.9-3.7-24.9,6.6-32,10.3\n" +
    "	C-111.3,379.8-99,389.3-91.9,402.4z\"/>\n" +
    "<circle id=\"XMLID_131_\" class=\"st4\" cx=\"-162.3\" cy=\"402.6\" r=\"5.7\"/>\n" +
    "<path id=\"XMLID_130_\" class=\"st4\" d=\"M-115.5,413.2c-0.4,0-0.8,0-1.3-0.1c1.7,2.6,3.1,5.5,3.8,8.7c0.8,3.5,4,6,7.6,6\n" +
    "	c0.6,0,1.2-0.1,1.8-0.2c4.2-1,6.8-5.2,5.8-9.4c-1.4-5.7-3.9-10.9-7.2-15.4C-105,408.6-109.7,413.2-115.5,413.2z\"/>\n" +
    "<path id=\"XMLID_129_\" class=\"st4\" d=\"M-152.1,376.1c-7.1-3.7-28.1-14.1-32-10.3c-4.5,4.3-2.1,33.7-1.9,36.6\n" +
    "	C-178.8,389.3-166.6,379.7-152.1,376.1z\"/>\n" +
    "</svg>\n" +
    "");
}]);

(function (angular) {
    'use strict';

    angular.module('znk.infra-sat.examUtility',[
        'znk.infra.contentGetters'
    ]);
})(angular);

(function () {
    'use strict';

    var CROSS_TEST_SCORE_ENUM = {
        0: {name: 'History / Social Studies'},
        1: {name: 'Science'}
    };

    angular.module('znk.infra-sat.examUtility')
        .service('ScoringService',["$q", "ExamTypeEnum", "StorageRevSrv", "$log", "SubScoreSrv", "CategoryService", function ($q, ExamTypeEnum, StorageRevSrv, $log, SubScoreSrv, CategoryService) {
            'ngInject';

            var keysMapConst = {
                crossTestScore: 'CrossTestScore',
                subScore: 'Subscore',
                miniTest: 'miniTest',
                test: 'test'
            };

            function _getScoreTableProm() {
                return StorageRevSrv.getContent({
                    exerciseType: 'scoretable'
                }).then(function (scoreTable) {
                    if (!scoreTable || !angular.isObject(scoreTable)) {
                        var errMsg = 'ScoringService _getScoreTableProm:' +
                            'no scoreTable or scoreTable is not an object! scoreTable: ' + scoreTable + '}';
                        $log.error(errMsg);
                        return $q.reject(errMsg);
                    }
                    return scoreTable;
                });
            }

            function _isShouldAddToScore(question) {
                return (question.isAnsweredCorrectly && !question.afterAllowedTime);
            }

            function _getRawScore(questionsResults) {
                var score = 0;
                angular.forEach(questionsResults, function (question) {
                    if (_isShouldAddToScore(question)) {
                        score += 1;
                    }
                });
                return score;
            }

            function _isTypeFull(typeId) {
                return ExamTypeEnum.FULL_TEST.enum === typeId;
            }

            function _getScoreTableKeyByTypeId(typeId) {
                return _isTypeFull(typeId) ? keysMapConst.test : keysMapConst.miniTest;
            }

            function _getDataFromTable(scoreTable, key, id, rawScore) {
                var data = angular.copy(scoreTable);
                if (angular.isDefined(key)) {
                    data = data[key];
                }
                if (angular.isDefined(id)) {
                    data = data[id];
                }
                if (angular.isDefined(rawScore)) {
                    data = data[rawScore];
                }
                return data;
            }

            function _mergeSectionsWithResults(sections, sectionsResults) {
                return sections.reduce(function (previousValue, currentValue) {
                    var currentSectionResult = sectionsResults.find(function (sectionResult) {
                        return +sectionResult.exerciseId === currentValue.id;
                    });
                    previousValue.push(angular.extend({}, currentSectionResult, currentValue));
                    return previousValue;
                }, []);
            }

            function _getResultsFn(scoreTable, questionsResults, typeId, id) {
                var rawScore = _getRawScore(questionsResults);
                var key = _getScoreTableKeyByTypeId(typeId);
                return _getDataFromTable(scoreTable, key, id, rawScore);
            }

            function _getTestScoreResultFn(scoreTable, questionsResults, typeId, categoryId) {
                var data = _getResultsFn(scoreTable, questionsResults, typeId, categoryId);
                return {
                    testScore: data
                };
            }

            function _getSectionScoreResultFn(scoreTable, questionsResults, typeId, subjectId) {
                var data = _getResultsFn(scoreTable, questionsResults, typeId, subjectId);
                return {
                    sectionScore: data
                };
            }

            function _getFullExamSubAndCrossScoresFn(scoreTable, sections, sectionsResults) {
                var mergeSections = _mergeSectionsWithResults(sections, sectionsResults);
                var subScoresMap = {};
                var crossTestScoresMap = {};
                var subScoresArrProms = [];
                angular.forEach(mergeSections, function (section) {
                    angular.forEach(section.questionResults, function (questionResult) {
                        var subScoresArrProm = SubScoreSrv.getSpecificCategorySubScores(questionResult.categoryId);
                        var sectionSubjectId = CategoryService.getCategoryLevel1ParentSync([section.categoryId, section.categoryId2]);
                        subScoresArrProm.then(function (subScoresArr) {
                            if (subScoresArr.length > 0) {
                                angular.forEach(subScoresArr, function (subScore) {
                                    if (!subScoresMap[subScore.id]) {
                                        subScoresMap[subScore.id] = {
                                            raw: 0,
                                            name: subScore.name,
                                            subjectId: sectionSubjectId
                                        };
                                    }
                                    if (_isShouldAddToScore(questionResult)) {
                                        subScoresMap[subScore.id].raw += 1;
                                    }
                                });
                            }
                            return subScoresArr;
                        });
                        subScoresArrProms.push(subScoresArrProm);
                        var crossTestScoreId = questionResult.crossTestScoreId;
                        if (angular.isDefined(crossTestScoreId) && crossTestScoreId !== null) {
                            if (!crossTestScoresMap[crossTestScoreId]) {
                                crossTestScoresMap[crossTestScoreId] = {
                                    raw: 0,
                                    name: CROSS_TEST_SCORE_ENUM[crossTestScoreId].name
                                };
                            }
                            if (_isShouldAddToScore(questionResult)) {
                                crossTestScoresMap[crossTestScoreId].raw += 1;
                            }
                        }
                    });
                });

                return $q.all(subScoresArrProms).then(function () {
                    angular.forEach(subScoresMap, function (subScore, key) {
                        subScoresMap[key].sum = _getDataFromTable(scoreTable, keysMapConst.subScore, key, subScore.raw);
                    });
                    angular.forEach(crossTestScoresMap, function (crossTestScores, key) {
                        crossTestScoresMap[key].sum = _getDataFromTable(scoreTable, keysMapConst.crossTestScore, key, crossTestScores.raw);
                    });
                    return {
                        subScores: subScoresMap,
                        crossTestScores: crossTestScoresMap
                    };
                });
            }

            // api

            this.isTypeFull = function (typeId) {
                return ExamTypeEnum.FULL_TEST.enum === typeId;
            };

            this.getTestScoreResult = function (questionsResults, typeId, categoryId) {
                return _getScoreTableProm().then(function (scoreTable) {
                    return _getTestScoreResultFn(scoreTable, questionsResults, typeId, categoryId);
                });
            };

            this.getSectionScoreResult = function (questionsResults, typeId, subjectId) {
                return _getScoreTableProm().then(function (scoreTable) {
                    return _getSectionScoreResultFn(scoreTable, questionsResults, typeId, subjectId);
                });
            };

            this.getFullExamSubAndCrossScores = function (sections, sectionsResults) {
                return _getScoreTableProm().then(function (scoreTable) {
                    return _getFullExamSubAndCrossScoresFn(scoreTable, sections, sectionsResults);
                });
            };

            this.rawScoreToScore = function (subjectId, rawScore) {
                return _getScoreTableProm().then(function (scoreTable) {
                    var roundedRawScore = Math.round(rawScore);
                    return _getDataFromTable(scoreTable, keysMapConst.test, subjectId, roundedRawScore);
                });
            };

            this.getTotalScoreResult = function (scoresArr) {
                var totalScores = 0;
                angular.forEach(scoresArr, function (score) {
                    totalScores += score;
                });
                return $q.when(totalScores);
            };
        }]);
})();

angular.module('znk.infra-sat.examUtility').run(['$templateCache', function($templateCache) {

}]);

(function (angular) {
    'use strict';

    angular.module('znk.infra-sat.exerciseUtilitySat', []);
})(angular);

(function(angular){
    'use strict';

    angular.module('znk.infra-sat.exerciseUtilitySat')
        .service('TestScoreCategoryEnum',["EnumSrv", function(EnumSrv) {
            'ngInject';

            var testScoreCategoryEnum = new EnumSrv.BaseEnum([
                ['MATH', 9, 'math'],
                ['READING', 10, 'reading'],
                ['WRITING', 11, 'writing'],
                ['ESSAY', 12, 'essay']
            ]);
            return testScoreCategoryEnum;
        }]);
})(angular);

(function(angular){
    'use strict';

    angular.module('znk.infra-sat.exerciseUtilitySat')
        .service('SubScoreSrv', ["CategoryService", "$q", "StorageRevSrv", "SubjectEnum", function(CategoryService, $q, StorageRevSrv, SubjectEnum) {
            'ngInject';

            function _getSubScoreCategoryData() {
                return StorageRevSrv.getContent({
                    exerciseId: null,
                    exerciseType: 'subscoreCategory'
                });
            }

            function _getSubScoreData(subScoreId) {
                return _getSubScoreCategoryData().then(function (subScoresCategoryData) {
                    return subScoresCategoryData[subScoreId];
                });
            }

            this.getSpecificCategorySubScores = function (specificCategoryId) {
                return CategoryService.getCategoryData(specificCategoryId).then(function (specificCategoryData) {
                    var allProm = [];
                    var subScoreKeys = ['subScore1Id', 'subScore2Id'];
                    angular.forEach(subScoreKeys, function (subScoreKey) {
                        var subScoreId = specificCategoryData[subScoreKey];
                        if (subScoreId || subScoreId === 0) {
                            allProm.push(_getSubScoreData(subScoreId));
                        }
                    });
                    return $q.all(allProm);
                });
            };

            this.getAllSubScoresBySubject = (function () {
                var getAllSubjectScoresBySubjectProm;
                return function () {
                    function _getMathOrVerbalSubjectIdIfCategoryNotEssay(category) {
                        return CategoryService.getSubjectIdByCategory(category).then(function (subjectId) {
                            if (subjectId === SubjectEnum.MATH.enum || subjectId === SubjectEnum.VERBAL.enum) {
                                return subjectId;
                            }
                        });
                    }

                    if (!getAllSubjectScoresBySubjectProm) {
                        var allSubScoresProm = _getSubScoreCategoryData();
                        var allSpecificCategoriesProm = CategoryService.getAllLevel4Categories();

                        getAllSubjectScoresBySubjectProm = $q.all([allSubScoresProm, allSpecificCategoriesProm]).then(function (res) {
                            var allSubScores = res[0];
                            var allSpecificCategories = res[1];
                            var subScorePerSubject = {};
                            subScorePerSubject[SubjectEnum.MATH.enum] = {};
                            subScorePerSubject[SubjectEnum.VERBAL.enum] = {};
                            var specificCategoryKeys = Object.keys(allSpecificCategories);
                            var promArray = [];
                            var subScoreKeys = ['subScore1Id', 'subScore2Id'];

                            angular.forEach(specificCategoryKeys, function (specificCategoryId) {
                                var specificCategory = allSpecificCategories[specificCategoryId];
                                var prom = _getMathOrVerbalSubjectIdIfCategoryNotEssay(specificCategory).then(function (subjectId) {
                                    if (angular.isDefined(subjectId)) {
                                        angular.forEach(subScoreKeys, function (subScoreKey) {
                                            var subScoreId = specificCategory[subScoreKey];
                                            if (subScoreId !== null && angular.isUndefined(subScorePerSubject[subjectId][subScoreKey])) {
                                                subScorePerSubject[subjectId][subScoreId] = allSubScores[subScoreId];
                                            }
                                        });
                                    }
                                });
                                promArray.push(prom);
                            });

                            return $q.all(promArray).then(function () {
                                return subScorePerSubject;
                            });
                        });
                    }

                    return getAllSubjectScoresBySubjectProm;
                };
            })();

            this.getSubScoreData = _getSubScoreData;

            this.getSubScoreCategory = _getSubScoreCategoryData;
        }]);
})(angular);

angular.module('znk.infra-sat.exerciseUtilitySat').run(['$templateCache', function($templateCache) {

}]);

(function (angular) {
    'use strict';

    angular.module('znk.infra-sat.lessonTopic', [
        'znk.infra.exerciseUtility'
    ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra-sat.lessonTopic').service('LessonTopicService', ["SubjectEnum", "LiveSessionSubjectEnum", "$log", function (SubjectEnum, LiveSessionSubjectEnum, $log) {
        'ngInject';
        this.getTopicSubjects = function (topicId) {
            var topicSubjects;

            switch (topicId) {
                case LiveSessionSubjectEnum.ENGLISH.enum:
                    topicSubjects = {
                        essay: SubjectEnum.ESSAY.enum,
                        verbal: SubjectEnum.VERBAL.enum
                    };
                    break;
                case LiveSessionSubjectEnum.MATH.enum:
                    topicSubjects = {
                        math: SubjectEnum.MATH.enum
                    };
                    break;
                default:
                    $log.error('Invalid topicId');
            }
            return topicSubjects;
        };
    }]);
})(angular);

angular.module('znk.infra-sat.lessonTopic').run(['$templateCache', function($templateCache) {

}]);

(function (angular) {
    'use strict';

    angular.module('znk.infra-sat.performance', [
        'znk.infra-sat.userGoals',
        'znk.infra.znkTimeline',
        'znk.infra.znkProgressBar'
    ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra-sat.performance')
        .config(["TimelineSrvProvider", function timelineConfig(TimelineSrvProvider) {
            'ngInject';

            TimelineSrvProvider.setColors({
                0: '#AF89D2', 7: '#F9D41B'
            });
        }]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra-sat.performance')
        .controller('PerformanceTimelineController',
        ["EstimatedScoreSrv", "UserGoalsService", "SubjectEnum", "$q", "$attrs", "$element", "ExerciseTypeEnum", function (EstimatedScoreSrv, UserGoalsService, SubjectEnum, $q, $attrs, $element, ExerciseTypeEnum) {
            'ngInject';

            var vm = this;
            var estimatedScoresDataProm = EstimatedScoreSrv.getEstimatedScores();
            var getGoalsProm = UserGoalsService.getGoals();
            var inProgressProm = false;
            var subjectEnumToValMap = SubjectEnum.getEnumMap();
            var currentSubjectId;

            // options
            var optionsPerDevice = {
                width: 685,
                height: 150,
                distance: 90,
                upOrDown: 100,
                yUp: 30,
                yDown: 100
            };

            var subjectIdToIndexMap = {
                diagnostic: 'diagnostic'
            };
            subjectIdToIndexMap[ExerciseTypeEnum.TUTORIAL.enum] = 'tutorial';
            subjectIdToIndexMap[ExerciseTypeEnum.PRACTICE.enum] = 'practice';
            subjectIdToIndexMap[ExerciseTypeEnum.SECTION.enum] = 'section';

            function _getSummaryData(summeryScore) {
                var x = summeryScore.lineTo.x;
                var y = (summeryScore.lineTo.y < optionsPerDevice.upOrDown) ? summeryScore.lineTo.y + optionsPerDevice.yDown : summeryScore.lineTo.y - optionsPerDevice.yUp;
                var angleDeg;
                if (summeryScore.next) {
                    angleDeg = Math.atan2(summeryScore.lineTo.y - summeryScore.next.y, summeryScore.lineTo.x - summeryScore.next.x) * 180 / Math.PI;
                }

                if (angleDeg && angleDeg < -optionsPerDevice.upOrDown && summeryScore.lineTo.y < optionsPerDevice.upOrDown) {
                    x -= 30;
                }

                return {
                    x: x,
                    y: y,
                    score: summeryScore.score,
                    prevScore: summeryScore.prev.score
                };
            }

            function _getRegularData(lastLineObj) {
                var lastLine = lastLineObj[lastLineObj.length - 1];
                var beforeLast = lastLineObj[lastLineObj.length - 2];
                var x = lastLine.lineTo.x - 13;
                var y = (lastLine.lineTo.y < optionsPerDevice.upOrDown) ? lastLine.lineTo.y + optionsPerDevice.yDown : lastLine.lineTo.y - optionsPerDevice.yUp;
                var angleDeg = Math.atan2(lastLine.lineTo.y - beforeLast.lineTo.y, lastLine.lineTo.x - beforeLast.lineTo.x) * 180 / Math.PI;

                if (angleDeg < -40 || angleDeg > 40) {
                    x += 20;
                }

                return {
                    x: x,
                    y: y,
                    score: lastLine.score,
                    prevScore: beforeLast.score
                };
            }

            function _scrolling() {
                var domElement = $element.children()[0];
                if (domElement.scrollWidth > domElement.clientWidth) {
                    domElement.scrollLeft += domElement.scrollWidth - domElement.clientWidth;
                }
            }

            function _getPromsOrValue() {
                if (!inProgressProm) {
                    inProgressProm = $q.all([estimatedScoresDataProm, getGoalsProm]);
                }
                return (angular.isFunction(inProgressProm)) ? inProgressProm : $q.when(inProgressProm);
            }

            vm.options = {
                colorId: vm.currentSubjectId,
                isMobile: false,
                width: optionsPerDevice.width,
                height: optionsPerDevice.height,
                isSummery: (vm.activeExerciseId) ? vm.activeExerciseId : false,
                type: 'multi',
                isMax: true,
                max: 29,
                min: 0,
                subPoint: 35,
                distance: optionsPerDevice.distance,
                lineWidth: 2,
                numbers: {
                    font: '200 12px Lato',
                    fillStyle: '#4a4a4a'
                },
                onFinish: function (obj) {
                    var summeryScore = obj.data.summeryScore;
                    var scoreData;

                    if (summeryScore) {
                        scoreData = _getSummaryData(summeryScore);
                    } else {
                        scoreData = _getRegularData(obj.data.lastLine);
                    }

                    vm.timelineMinMaxStyle = { 'top': scoreData.y + 'px', 'left': scoreData.x + 'px' };

                    _getPromsOrValue().then(function (results) {
                        var userGoals = results[1];
                        var points = userGoals[subjectEnumToValMap[currentSubjectId]] - scoreData.score;
                        vm.goalPerSubject = scoreData.score;
                        vm.points = (points > 0) ? points : false;
                    });

                    if (scoreData.score && scoreData.prevScore) {
                        if (scoreData.score > scoreData.prevScore) {
                            vm.timelineLinePlus = '+' + (scoreData.score - scoreData.prevScore);
                            vm.isRed = false;
                        } else if (scoreData.score < scoreData.prevScore) {
                            vm.timelineLinePlus = '-' + (scoreData.prevScore - scoreData.score);
                            vm.isRed = true;
                        }
                        vm.onTimelineFinish({ subjectDelta: vm.timelineLinePlus });
                    }

                    _scrolling();

                    vm.toolTipArr = obj.data.lastLine.slice(1);
                }
            };

            function _extendData(dataPerSubject) {
                if (!vm.showTooltips) {
                    return addIconKey(dataPerSubject);
                }

                var newDataArr = [];
                var exerciseResults;
                angular.forEach(dataPerSubject, function (value, index) {
                    // add icon key
                    var type = subjectIdToIndexMap[value.exerciseType];
                    if (index === 0 && type === 'section') {
                        type = 'diagnostic';
                    }
                    value.iconKey = type || false;
                    // add workout name and title
                    if (vm.results && vm.results.exerciseResults) {
                        exerciseResults = vm.results.exerciseResults;
                        for (var i = 0, ii = exerciseResults.length; i < ii; i++) {
                            if (value.exerciseId === exerciseResults[i].exerciseId) {
                                value.workoutTitle = exerciseResults[i].exerciseName + ': ' + exerciseResults[i].exerciseDescription;
                                break;
                            }
                        }
                    }
                    newDataArr.push(value);
                });
                return newDataArr;
            }

            function addIconKey(dataPerSubject) {
                var newDataArr = [];
                angular.forEach(dataPerSubject, function (value, index) {
                    var type = subjectIdToIndexMap[value.exerciseType];
                    if (index === 0 && type === 'section') {
                        type = 'diagnostic';
                    }
                    value.iconKey = type || false;
                    newDataArr.push(value);
                });
                return newDataArr;
            }

            $attrs.$observe('subjectId', function (newVal, oldVal) {
                if (newVal === oldVal) {
                    return;
                }
                vm.currentSubjectId = newVal;
                _getPromsOrValue().then(function (results) {
                    inProgressProm = results;
                    var estimatedScoresData = results[0];
                    vm.animation = true;
                    vm.timelineLinePlus = false;
                    vm.timeLineData = {
                        data: _extendData(estimatedScoresData[vm.currentSubjectId]),
                        id: vm.currentSubjectId
                    };
                    vm.points = 0;
                });
            });
        }]);
})(angular);

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

(function (angular) {
    'use strict';

    angular.module('znk.infra-sat.performance')
        .service('masteryLevel', ["$filter", function ($filter) {
            'ngInject';

            var translateFilter = $filter('translate');

            this.getMasteryLevel = function (levelProgress) {
                var masteryLevel = '';
                if (levelProgress < 30) {
                    masteryLevel = 'NOVICE';
                } else if (levelProgress >= 30 && levelProgress < 55) {
                    masteryLevel = 'AVERAGE';
                } else if (levelProgress >= 55 && levelProgress < 75) {
                    masteryLevel = 'ADVANCE';
                } else if (levelProgress >= 75 && levelProgress < 95) {
                    masteryLevel = 'EXPERT';
                } else if (levelProgress >= 95 && levelProgress <= 100) {
                    masteryLevel = 'MASTER';
                }
                return translateFilter('PERFORMANCE_SAT.MASTERY_LEVEL.' + masteryLevel);
            };
        }]);
})(angular);

(function(angular){
    'use strict';

    angular.module('znk.infra-sat.performance')
        .service('PerformanceData', ["$q", "masteryLevel", "StatsSrv", "SubScoreSrv", "SubjectEnum", "TestScoreCategoryEnum", "CategoryService", "StatsQuerySrv", "StatsLevelEnum", function($q, masteryLevel, StatsSrv, SubScoreSrv, SubjectEnum, TestScoreCategoryEnum, CategoryService, StatsQuerySrv, StatsLevelEnum) {
            'ngInject';

            function _getSubjectId(parentsIds) {
                return parentsIds[parentsIds.length - 1];
            }

            function _isEssayCategory(parentsIds) {
                var subjectId = _getSubjectId(parentsIds);
                return subjectId === SubjectEnum.ESSAY.enum;
            }

            function _calculateCategoryPerformanceData(category) {
                if (!category) {
                    return {};
                }

                var progress, avgTime;

                var totalQuestionsNum = category.totalQuestions;
                if (totalQuestionsNum) {
                    progress = Math.round(category.correct / category.totalQuestions * 100);
                    avgTime = Math.round(category.totalTime / totalQuestionsNum / 1000);
                } else {
                    progress = avgTime = 0;
                }

                return {
                    categoryId: category.id,
                    progress: progress,
                    masteryLevel: masteryLevel.getMasteryLevel(progress),
                    avgTime: avgTime
                };
            }

            function _getStatsKey(id) {
                return 'id_' + id;
            }

            function _getMathAndVerbalPerformanceData() {
                return $q.all([
                    StatsSrv.getLevelStats(StatsLevelEnum.LEVEL2.enum),
                    StatsSrv.getLevelStats(StatsLevelEnum.LEVEL4.enum)

                ]).then(function (res) {
                    var testScoreStats = res[0] || {};
                    var specificCategoryStats = res[1] || {};

                    var mathStats = testScoreStats[_getStatsKey(TestScoreCategoryEnum.MATH.enum)];
                    var mathSubjectPerformanceData = _calculateCategoryPerformanceData(mathStats);

                    var readingStats = testScoreStats[_getStatsKey(TestScoreCategoryEnum.READING.enum)];
                    var writingStats = testScoreStats[_getStatsKey(TestScoreCategoryEnum.WRITING.enum)];
                    var verbalSubjectPerformanceData = {
                        reading: _calculateCategoryPerformanceData(readingStats),
                        writing: _calculateCategoryPerformanceData(writingStats)
                    };

                    var mathAndVerbalPerformanceData = {};
                    mathAndVerbalPerformanceData[SubjectEnum.MATH.enum] = mathSubjectPerformanceData;
                    mathAndVerbalPerformanceData[SubjectEnum.VERBAL.enum] = verbalSubjectPerformanceData;

                    var mathAndVerbalSubScoreData = {};
                    mathAndVerbalSubScoreData[SubjectEnum.MATH.enum] = {};
                    mathAndVerbalSubScoreData[SubjectEnum.VERBAL.enum] = {};

                    var allProm = [];
                    angular.forEach(specificCategoryStats, function (specificCategory) {
                        if (!_isEssayCategory(specificCategory.parentsIds)) {
                            var subjectId = _getSubjectId(specificCategory.parentsIds);
                            var subScoresData = mathAndVerbalSubScoreData[subjectId];
                            var getSpecificCategorySubScoresProm = SubScoreSrv.getSpecificCategorySubScores(specificCategory.id)
                                .then(function (subScores) {
                                    angular.forEach(subScores, function (subScore) {
                                        if (subScore) {
                                            if (!subScoresData[subScore.id]) {
                                                subScoresData[subScore.id] = angular.copy(subScore);
                                                subScoresData[subScore.id].totalQuestions = 0;
                                                subScoresData[subScore.id].correct = 0;
                                                subScoresData[subScore.id].totalTime = 0;
                                            }

                                            subScoresData[subScore.id].totalQuestions += specificCategory.totalQuestions;
                                            subScoresData[subScore.id].correct += specificCategory.correct;
                                            subScoresData[subScore.id].totalTime += specificCategory.totalTime;
                                        }
                                    });
                                });
                            allProm.push(getSpecificCategorySubScoresProm);
                        }
                    });

                    return $q.all(allProm).then(function () {
                        angular.forEach(mathAndVerbalSubScoreData, function (subScoresForSubject, subjectId) {
                            var subscoreArray = [];
                            angular.forEach(subScoresForSubject, function (subScore) {
                                var subScorePerformance = _calculateCategoryPerformanceData(subScore);
                                subscoreArray.push(subScorePerformance);
                            });

                            mathAndVerbalPerformanceData[subjectId].subscoreArray = subscoreArray;
                        });

                        return mathAndVerbalPerformanceData;
                    });
                });
            }

            function _getEssayPerformanceData() {
                return $q.all([
                    StatsSrv.getLevelStats(StatsLevelEnum.LEVEL2.enum),
                    StatsSrv.getLevelStats(StatsLevelEnum.LEVEL3.enum)
                ]).then(function (res) {
                    var testScoreLevelStats = res[0] || {};
                    var generalCategoryLevelStats = res[1] || {};

                    var essayStats = testScoreLevelStats[_getStatsKey(TestScoreCategoryEnum.ESSAY.enum)];
                    var essayGeneralCategoryPerformanceData = _calculateCategoryPerformanceData(essayStats);
                    essayGeneralCategoryPerformanceData.subscoreArray = [];

                    angular.forEach(generalCategoryLevelStats, function (generalCategoryStats) {
                        if (_isEssayCategory(generalCategoryStats.parentsIds)) {
                            var generalCategoryPerformance = _calculateCategoryPerformanceData(generalCategoryStats);
                            essayGeneralCategoryPerformanceData.subscoreArray.push(generalCategoryPerformance);
                        }
                    });

                    return essayGeneralCategoryPerformanceData;
                });
            }

            function _addingNotPracticedSubScores(mathAndVerbalSubScore, allSubScoresBySubject) {
                var subjectKeys = Object.keys(allSubScoresBySubject);
                angular.forEach(subjectKeys, function (subjectId) {
                    _extendSubjectPerformance(mathAndVerbalSubScore[subjectId], allSubScoresBySubject[subjectId]);
                });

                return mathAndVerbalSubScore;
            }

            function _extendSubjectPerformance(performanceToExtend, allRelevantCategories) {
                var generalCategoriesPerformanceArr = performanceToExtend.subscoreArray;
                for (var i = 0; i < generalCategoriesPerformanceArr.length; i++) {
                    var categoryId = generalCategoriesPerformanceArr[i].categoryId;
                    delete allRelevantCategories[categoryId];
                }
                performanceToExtend.noDataItems = allRelevantCategories;
                return performanceToExtend;
            }

            function _buildWeakestCategory(subjectsObj, performanceData) {
                if (!subjectsObj) {
                    return $q.when(performanceData);
                }

                var subjectsKeys = Object.keys(subjectsObj);
                var promArr = [];
                angular.forEach(subjectsKeys, function (subjectkey) {
                    var prom = StatsQuerySrv.getWeakestCategoryInLevel(StatsLevelEnum.LEVEL3.enum, null, subjectsObj[subjectkey].id);
                    promArr.push(prom);
                });

                return $q.all(promArr).then(function (weakestCategoryResults) {
                    angular.forEach(weakestCategoryResults, function (weakestCategory) {
                        performanceData[weakestCategory.parentsIds[1]].weakestCategory = {
                            progress: _getProgressPercentage(weakestCategory.totalQuestions, weakestCategory.correct),
                            id: weakestCategory.id
                        };
                    });
                    return performanceData;
                });
            }

            function _getProgressPercentage(totalQuestions, correctAnswers) {
                return totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
            }

            function _buildTestScore(testScoreObj, performanceData) {
                if (!testScoreObj) {
                    return performanceData;
                }

                var testScoreKeys = Object.keys(testScoreObj);
                angular.forEach(testScoreKeys, function (testScoreKey) {
                    var testScoreData = {};

                    testScoreData.levelProgress = _getProgressPercentage(testScoreObj[testScoreKey].totalQuestions, testScoreObj[testScoreKey].correct);
                    testScoreData.avgTime = _getAvgTime(testScoreObj[testScoreKey].totalQuestions, testScoreObj[testScoreKey].totalTime);
                    testScoreData.testScoreId = testScoreObj[testScoreKey].id;
                    testScoreData.generalCategoryArray = [];

                    var subjectId = testScoreObj[testScoreKey].parentsIds[0];
                    if (angular.isDefined(performanceData[subjectId])) {
                        if (!performanceData[subjectId].testScoreArray) {
                            performanceData[subjectId].testScoreArray = [];
                        }
                        performanceData[subjectId].testScoreArray.push(testScoreData);
                    }
                });

                return performanceData;
            }

            function _buildGeneralCategories(statsObj, performanceData) {
                function _setCategoryToCategoryArray(subjectObj, testScoreId, generalCategory) {
                    if (subjectObj.testScoreArray) {
                        for (var i = 0; i < subjectObj.testScoreArray.length; i++) {
                            if (angular.isDefined(subjectObj.testScoreArray[i]) && subjectObj.testScoreArray[i].testScoreId === testScoreId) {
                                subjectObj.testScoreArray[i].generalCategoryArray.push(generalCategory);
                            }
                        }
                    }
                }

                if (!statsObj) {
                    return $q.when(performanceData);
                }
                return CategoryService.getCategoryMap().then(function (categoryMap) {
                    return CategoryService.getAllLevelCategories(3).then(function (generalCategories) {
                        angular.forEach(generalCategories, function (generalCategory) {
                            var generalCategoryData = {};
                            var generalCategoryStats = statsObj['id_' + generalCategory.id];
                            var SUBJECT_ID, TEST_SCORE_ID;
                            if (generalCategoryStats) {
                                SUBJECT_ID = generalCategoryStats.parentsIds[1];
                                TEST_SCORE_ID = generalCategoryStats.parentsIds[0];
                                generalCategoryData.levelProgress = _getProgressPercentage(generalCategoryStats.totalQuestions, generalCategoryStats.correct);
                                generalCategoryData.avgTime = _getAvgTime(generalCategoryStats.totalQuestions, generalCategoryStats.totalTime);
                                generalCategoryData.id = generalCategoryStats.id;
                            } else {
                                TEST_SCORE_ID = categoryMap[generalCategory.id].parentId;
                                SUBJECT_ID = categoryMap[TEST_SCORE_ID].parentId;
                                generalCategoryData.levelProgress = undefined;
                                generalCategoryData.avgTime = undefined;
                                generalCategoryData.id = generalCategory.id;
                            }

                            _setCategoryToCategoryArray(performanceData[SUBJECT_ID], TEST_SCORE_ID, generalCategoryData);
                        });

                        return performanceData;
                    });
                });
            }

            function _buildSpecificCategories(specificObj, performanceData) {
                return CategoryService.get().then(function (categories) {
                    angular.forEach(performanceData, function (subject) {
                        angular.forEach(subject.testScoreArray, function (testscoreCat) {
                            angular.forEach(testscoreCat.generalCategoryArray, function (generalCat) {
                                var specificChildrens = categories.filter(function (category) {
                                    return category.parentId === generalCat.id;
                                });

                                generalCat.specificCategoryArray = [];
                                angular.forEach(specificChildrens, function (specificChildren) {
                                    var specificStatsData = specificObj['id_' + specificChildren.id];
                                    if (specificStatsData) {
                                        generalCat.specificCategoryArray.push({
                                            levelProgress: _getProgressPercentage(specificStatsData.totalQuestions, specificStatsData.correct),
                                            avgTime: _getAvgTime(specificStatsData.totalQuestions, specificStatsData.totalTime),
                                            correct: specificStatsData.correct,
                                            wrong: specificStatsData.wrong,
                                            totalQuestions: specificStatsData.totalQuestions,
                                            id: specificStatsData.id
                                        });
                                    } else {
                                        generalCat.specificCategoryArray.push({
                                            levelProgress: undefined,
                                            avgTime: undefined,
                                            correct: undefined,
                                            wrong: undefined,
                                            totalQuestions: undefined,
                                            id: specificChildren.id
                                        });
                                    }
                                });
                            });
                        });
                    });
                    return performanceData;
                });
            }

            function _getAvgTime(totalQuestions, totalTime) {
                return totalQuestions > 0 ? Math.round((totalTime / 1000) / totalQuestions) : 0;
            }

            function _calcVerbalAvgMastry(performanceData) {
                var readingMastry, writingMastry;
                var readingAvgTime = 0,
                    writingAvgTime = 0;
                if (performanceData && performanceData[SubjectEnum.VERBAL.enum]) {
                    if (performanceData[SubjectEnum.VERBAL.enum].reading) {
                        readingMastry = performanceData[SubjectEnum.VERBAL.enum].reading.progress;
                        readingAvgTime = performanceData[SubjectEnum.VERBAL.enum].reading.avgTime;
                    }

                    if (performanceData[SubjectEnum.VERBAL.enum].writing) {
                        writingMastry = performanceData[SubjectEnum.VERBAL.enum].writing.progress;
                        writingAvgTime = performanceData[SubjectEnum.VERBAL.enum].writing.avgTime;
                    }

                    performanceData[SubjectEnum.VERBAL.enum].progress = (readingMastry + writingMastry) / 2;
                    performanceData[SubjectEnum.VERBAL.enum].avgTime = (readingAvgTime + writingAvgTime) / 2;
                }
            }

            function _calcSubScoreSpecificCategory(_performanceData, allSpecificCategories, specificStats) {
                angular.forEach(specificStats, function (specificCategoryStats, categoryId) {
                    categoryId = categoryId.replace('id_', '');
                    var subjectId = specificCategoryStats.parentsIds[specificCategoryStats.parentsIds.length - 1];
                    var categorySubScore1 = allSpecificCategories[categoryId].subScore1Id;
                    var categorySubScore2 = allSpecificCategories[categoryId].subScore2Id;

                    if (angular.isDefined(categorySubScore1) || angular.isDefined(categorySubScore2)) {
                        angular.forEach(_performanceData[subjectId].subscoreArray, function (subscoreData) {
                            if (+subscoreData.categoryId === categorySubScore1 || +subscoreData.categoryId === categorySubScore2) {
                                if (!angular.isArray(subscoreData.specificArray)) {
                                    subscoreData.specificArray = [];
                                }

                                subscoreData.specificArray.push({
                                    id: categoryId,
                                    name: allSpecificCategories[categoryId].name,
                                    levelProgress: _getProgressPercentage(specificCategoryStats.totalQuestions, specificCategoryStats.correct),
                                    correct: specificCategoryStats.correct,
                                    wrong: specificCategoryStats.wrong,
                                    totalQuestions: specificCategoryStats.totalQuestions
                                });
                            }
                        });
                    }
                });
            }

            this.getPerformanceData = function () {
                return $q.all([
                    _getMathAndVerbalPerformanceData(),
                    _getEssayPerformanceData(),
                    SubScoreSrv.getAllSubScoresBySubject(),
                    CategoryService.getAllGeneralCategoriesBySubjectId(SubjectEnum.ESSAY.enum),
                    CategoryService.getAllLevelCategories(4),
                    StatsSrv.getStats()
                ]).then(function (res) {
                    var mathAndVerbalSubScorePerformanceData = res[0];
                    var essayPerformanceData = res[1];
                    var allSubScoresBySubjects = res[2];
                    var allGeneralCategories = angular.copy(res[3]);
                    var allSpecificCategories = angular.copy(res[4]);
                    var stats = res[5];

                    var performanceData = _addingNotPracticedSubScores(mathAndVerbalSubScorePerformanceData, allSubScoresBySubjects);
                    performanceData[SubjectEnum.ESSAY.enum] = _extendSubjectPerformance(essayPerformanceData, allGeneralCategories);

                    _calcVerbalAvgMastry(performanceData);

                    _calcSubScoreSpecificCategory(performanceData, allSpecificCategories, stats[StatsLevelEnum.LEVEL4.val]);

                    return _buildWeakestCategory(stats[StatsLevelEnum.LEVEL1.val], performanceData).then(function (newPerformanceData) {
                        performanceData = _buildTestScore(stats[StatsLevelEnum.LEVEL2.val], newPerformanceData);
                        return _buildGeneralCategories(stats[StatsLevelEnum.LEVEL3.val], performanceData).then(function (performanceWithTestScore) {
                            return _buildSpecificCategories(stats[StatsLevelEnum.LEVEL4.val], performanceWithTestScore).then(function (_performanceData) {
                                return _performanceData;
                            });
                        });
                    });
                });
            };

        }]);
})(angular);

angular.module('znk.infra-sat.performance').run(['$templateCache', function($templateCache) {
  $templateCache.put("components/performance/directives/performanceTimeline/performanceTimeline.template.html",
    "<div class=\"performance-timeline znk-scrollbar\" translate-namespace=\"PERFORMANCE_TIMELINE\">\n" +
    "    <div class=\"time-line-wrapper\">\n" +
    "        <div class=\"progress-val\" ng-style=\"vm.timelineMinMaxStyle\" ng-if=\"vm.timeLineData.data.length\">\n" +
    "            <div class=\"goal-wrapper\">{{vm.goalPerSubject}}\n" +
    "                <div class=\"timeline-plus\"\n" +
    "                     ng-if=\"vm.timelineLinePlus && vm.showInduction\"\n" +
    "                     ng-class=\"{ 'red-point': vm.isRed, 'green-point': !vm.isRed }\">\n" +
    "                    {{vm.timelineLinePlus}}\n" +
    "                </div>\n" +
    "            </div>\n" +
    "            <div class=\"progress-title\"\n" +
    "                 ng-style=\"{ visibility: (vm.points) ? 'visiable' : 'hidden' }\"\n" +
    "                 translate=\".POINTS_LEFT\"\n" +
    "                 translate-values=\"{points: {{vm.points}} }\">\n" +
    "            </div>\n" +
    "        </div>\n" +
    "        <div class=\"tool-tip-area\"\n" +
    "             ng-if=\"vm.showTooltips\"\n" +
    "             ng-repeat=\"tooltip in vm.toolTipArr track by $index\"\n" +
    "             ng-class=\"{'last-item':$last === true}\"\n" +
    "             ng-style=\"{'top': $last === true ? (tooltip.lineTo.y+50) +'px' : (tooltip.lineTo.y+60) +'px', 'left': $last === true ? (tooltip.lineTo.x - 11) +'px' : (tooltip.lineTo.x-1)+'px'}\">\n" +
    "            <md-tooltip md-direction=\"top\" class=\"tooltip-box md-whiteframe-2dp\">\n" +
    "                <div class=\"tooltip-content\">\n" +
    "                    <div class=\"exercise-date\">{{tooltip.time | date: 'MMM dd'}}</div>\n" +
    "                    <div class=\"exercise-title\">{{tooltip.workoutTitle}}</div>\n" +
    "                    <div class=\"score-title\" translate-values=\"{subjectName: vm.subjectEnumToValMap[vm.currentSubjectId]}\" translate=\".ESTIMATED_SUBJECT_SCORE\"></div>\n" +
    "                    <div class=\"exercise-score\">{{tooltip.score}}</div>\n" +
    "                </div>\n" +
    "            </md-tooltip>\n" +
    "        </div>\n" +
    "        <canvas znk-timeline timeline-data=\"vm.timeLineData\" timeline-settings=\"vm.options\"></canvas>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
}]);

(function (angular) {
    'use strict';

    angular.module('znk.infra-sat.socialSharingSat', [
        'znk.infra-sat.configSat',
        'znk.infra.contentGetters'
    ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra-sat.socialSharingSat')
        .config(["EstimatedScoreSrvProvider", "SubjectEnumConst", "EstimatedScoreEventsHandlerSrvProvider", "exerciseTypeConst", "CategoryServiceProvider", function estimatedScoreConfig(EstimatedScoreSrvProvider, SubjectEnumConst,EstimatedScoreEventsHandlerSrvProvider, exerciseTypeConst, CategoryServiceProvider) {
            'ngInject';

            rawScoreToScoreFnGetter.$inject = ["ScoringService"];
            eventProcessControl.$inject = ["SubjectEnum"];
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
            EstimatedScoreEventsHandlerSrvProvider.setExerciseRawPoints(exerciseTypeConst.SECTION, defaultRawPointsForExercise);
            EstimatedScoreEventsHandlerSrvProvider.setExerciseRawPoints(exerciseTypeConst.TUTORIAL, defaultRawPointsForExercise);
            EstimatedScoreEventsHandlerSrvProvider.setExerciseRawPoints(exerciseTypeConst.PRACTICE, defaultRawPointsForExercise);

            function eventProcessControl(SubjectEnum) {
                'ngInject';//jshint ignore:line

                return function (exerciseType, exercise) {
                    var exerciseSubjedctId = categoryService.getCategoryLevel1ParentSync([exercise.categoryId, exercise.categoryId2]);
                    return exerciseSubjedctId !== SubjectEnum.ESSAY.enum;
                };
            }

            EstimatedScoreEventsHandlerSrvProvider.setEventProcessControl(eventProcessControl);
        }]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra-sat.socialSharingSat')
        .config(["SocialSharingSrvProvider", function(SocialSharingSrvProvider){
            SocialSharingSrvProvider.setPoints({
                600: {
                    background: 'background-lowest',
                    banner1: 'summary-congrats-banner-600-1',
                    banner2: 'summary-congrats-banner-600-1',
                    shareUrlMap: {
                        math: 'SAT-FB-share-post-math-600.png',
                        verbal: 'SAT-FB-share-post-verbal-600.png'
                    }
                },
                650: {
                    background: 'background-middle-1',
                    banner1: 'summary-congrats-banner-650-1',
                    banner2: 'summary-congrats-banner-650-1',
                    shareUrlMap: {
                        math: 'SAT-FB-share-post-math-650.png',
                        verbal: 'SAT-FB-share-post-verbal-650.png'
                    }
                },
                700: {
                    background: 'background-middle-2',
                    banner1: 'summary-congrats-banner-700-1',
                    banner2: 'summary-congrats-banner-700-1',
                    shareUrlMap: {
                        math: 'SAT-FB-share-post-math-700.png',
                        verbal: 'SAT-FB-share-post-verbal-700.png'
                    }
                },
                750: {
                    background: 'background-highest',
                    banner1: 'summary-congrats-banner-750-1',
                    banner2: 'summary-congrats-banner-750-1',
                    shareUrlMap: {
                        math: 'SAT-FB-share-post-math-750.png',
                        verbal: 'SAT-FB-share-post-verbal-750.png'
                    }
                },
                improved: {
                    background: 'background-improved',
                    banner1: 'summary-congrats-banner-improved-1',
                    banner2: 'summary-congrats-banner-improved-2',
                    shareUrlMap: {
                        math: 'SAT-FB-share-post-math-improved.png',
                        verbal: 'SAT-FB-share-post-verbal-improved.png'
                    }
                }
            });
        }]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra-sat.socialSharingSat')
        .provider('SocialSharingSrv', function () {
            var _pointsConfig;

            this.setPoints = function (pointsConfig) {
                _pointsConfig = pointsConfig;
            };

            this.$get = ["EstimatedScoreSrv", "$log", "$q", function (EstimatedScoreSrv, $log, $q) {
                'ngInject';

                var socialSharingSrvObj = {};

                function _getBiggestScore(currentScore) {
                    var biggestScore = 0;
                    angular.forEach(currentScore, function (val) {
                        if (val.score > biggestScore) {
                            biggestScore = val.score;
                        }
                    });
                    return biggestScore;
                }

                function _getConfigRange(config) {
                    var configArr = Object.keys(config).filter(function (num) {
                        var keyNum = +num;
                        return (angular.isNumber(keyNum) && !isNaN(keyNum));
                    });
                    var lowestNum = Math.min.apply(null, configArr);
                    var highestNum = Math.max.apply(null, configArr);
                    return {
                        lowestNum: lowestNum,
                        highestNum: highestNum
                    };
                }

                function _isOutOfRange(rangeObj, scoresArr) {
                    var scoresArrCopy = angular.copy(scoresArr);
                    scoresArrCopy.pop();
                    return scoresArrCopy.filter(function (scoreVal) {
                        return (scoreVal.score >= rangeObj.highestNum);
                    });
                }

                function _getCurScore(config, curScore, lastScore, biggestScore, alreadyInArray, outOfRangeArr) {
                    var calcScore = false;
                    // if curScore is larger then lastScore, see if there's a match
                    if (biggestScore === curScore && !alreadyInArray && outOfRangeArr.length === 0) {
                        angular.forEach(config, function (val, key) {
                            var keyNum = +key;
                            if (angular.isObject(val) && !angular.isArray(val)) {
                                if (curScore >= keyNum) {
                                    calcScore = angular.extend(val, {points: keyNum, isImproved: false});
                                }
                            } else {
                                $log.error('SocialSharingSrv _getCurScore: val in config must be an object! key: ' + keyNum);
                            }
                        });
                    }

                    // if no match from config, see if there's an improvement
                    if (!calcScore && lastScore && config.improved && curScore >= biggestScore && curScore > lastScore) {
                        calcScore = angular.extend(config.improved, {points: (curScore - lastScore), isImproved: true});
                    }

                    return calcScore;
                }


                function _calcScores(scoresArr) {
                    if (scoresArr.length === 0) {
                        return false;
                    }
                    var curScore = scoresArr[scoresArr.length - 1].score;
                    var lastScore = scoresArr[scoresArr.length - 2] ? scoresArr[scoresArr.length - 2].score : void(0);
                    var biggestScore = _getBiggestScore(scoresArr);
                    var rangeObj = _getConfigRange(_pointsConfig);
                    var highestScoreIndex = scoresArr.findIndex(function (scoreVal) {
                        return scoreVal.score >= curScore;
                    });
                    var outOfRangeArr = _isOutOfRange(rangeObj, scoresArr);
                    var alreadyInArray = highestScoreIndex !== (scoresArr.length - 1);
                    return _getCurScore(_pointsConfig, curScore, lastScore, biggestScore, alreadyInArray, outOfRangeArr);
                }

                socialSharingSrvObj.getSharingData = function (subjectId) {
                    if (!_pointsConfig) {
                        $log.error('SocialSharingSrv getSharingData: points should be configured in config phase!');
                        return $q.when(false);
                    }
                    return EstimatedScoreSrv.getEstimatedScores().then(function (scoresMap) {
                        scoresMap = angular.copy(scoresMap);
                        var scoresArr = scoresMap[subjectId];
                        if (!scoresArr) {
                            $log.error('SocialSharingSrv getSharingData: no match of subjectId in scores obj! subjectId: ' + subjectId);
                            return $q.reject(false);
                        }
                        // remove diagnostic
                        scoresArr.splice(0, 1);
                        return _calcScores(scoresArr);
                    });
                }
                ;

                return socialSharingSrvObj;
            }];
        });
})(angular);

angular.module('znk.infra-sat.socialSharingSat').run(['$templateCache', function($templateCache) {

}]);

(function (angular) {
    'use strict';

    angular.module('znk.infra-sat.userGoals', [
        'znk.infra.auth'
    ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra-sat.userGoals')
        .service('UserGoalsService', ["InfraConfigSrv", "StorageSrv", "ENV", "$q", function (InfraConfigSrv, StorageSrv, ENV, $q) {
            'ngInject';

            var goalsPath = StorageSrv.variables.appUserSpacePath + '/goals';
            var defaultSubjectScore = 600;

            function _getGoals() {
                return InfraConfigSrv.getStudentStorage().then(function(studentStorage) {
                    return studentStorage.get(goalsPath).then(function (userGoals) {
                        if (Object.keys(userGoals).length === 0) {
                            userGoals = _defaultUserGoals();
                        }
                        return userGoals;
                    });
                });
            }

            function _setGoals(newGoals) {
                if (arguments.length && typeof newGoals !== 'undefined') {
                    return InfraConfigSrv.getStudentStorage().then(function(studentStorage) {
                        return studentStorage.set(goalsPath, newGoals);
                    });
                }
                return InfraConfigSrv.getStudentStorage().then(function(studentStorage) {
                    return studentStorage.get(goalsPath).then(function (userGoals) {
                        if (!userGoals.goals) {
                            userGoals.goals = {
                                isCompleted: false,
                                verbal: defaultSubjectScore,
                                math: defaultSubjectScore,
                                totalScore: defaultSubjectScore * 2
                            };
                        }
                        return userGoals;
                    });
                });
            }

            function _calcCompositeScore(userSchools, save) {
                // The calculation for composite score in ACT:
                // 1. For each school in US, we have min & max score
                // 2. Calc the average score for each school and set it for each subject goal

                return _getGoals().then(function (userGoals) {
                    var minSchoolScore = 400,
                        maxSchoolScore = 1600,
                        avgScores = [];

                    angular.forEach(userSchools, function (school) {
                        var school25th = isNaN(school.total25th) ? minSchoolScore : school.total25th;
                        var school75th = isNaN(school.total75th) ? maxSchoolScore : school.total75th;
                        avgScores.push((school25th * 0.25) + (school75th * 0.75));
                    });

                    var avgSchoolsScore;
                    if (avgScores.length) {
                        avgSchoolsScore = avgScores.reduce(function (a, b) {
                            return a + b;
                        });
                        avgSchoolsScore = Math.round(avgSchoolsScore / avgScores.length);
                    } else {
                        avgSchoolsScore = defaultSubjectScore;
                    }

                    userGoals = {
                        isCompleted: false,
                        verbal: avgSchoolsScore || defaultSubjectScore,
                        math: avgSchoolsScore || defaultSubjectScore
                    };

                    userGoals.totalScore = _averageSubjectsGoal(userGoals);
                    var prom = save ? _setGoals(userGoals) : $q.when(userGoals);
                    return prom;
                });
            }

            function _defaultUserGoals() {
                return {
                    isCompleted: false,
                    verbal: defaultSubjectScore,
                    math: defaultSubjectScore,
                    totalScore: defaultSubjectScore * 2
                };
            }

            function _averageSubjectsGoal(goals) {
                var math = goals.math || defaultSubjectScore;
                var verbal = goals.english || defaultSubjectScore;
                return Math.round((math + verbal) / 2);
            }

            this.getGoals = _getGoals;
            this.setGoals = _setGoals;
            this.calcCompositeScore = _calcCompositeScore;
        }]);
})(angular);

angular.module('znk.infra-sat.userGoals').run(['$templateCache', function($templateCache) {

}]);
