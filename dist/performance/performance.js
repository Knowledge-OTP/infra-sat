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
                var estimatedScoresDataProm = EstimatedScoreSrv.getEstimatedScoresData();
                var getGoalsProm = UserGoalsService.getGoals();
                var inProgressProm = false;
                var subjectEnumToValMap = SubjectEnum.getEnumMap();
                var currentSubjectId;

                // options
                var optionsPerDevice = {
                    width: 705,
                    height: 150,
                    distance: 90,
                    upOrDown: 100,
                    yUp: 30,
                    yDown: 100
                };

                var subjectIdToIndexMap = {
                    diagnostic: 'diagnostic'
                };
                subjectIdToIndexMap [ExerciseTypeEnum.TUTORIAL.enum] = 'tutorial';
                subjectIdToIndexMap [ExerciseTypeEnum.PRACTICE.enum] = 'practice';
                subjectIdToIndexMap [ExerciseTypeEnum.SECTION.enum] = 'section';

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

                        vm.timelineMinMaxStyle = {'top': scoreData.y + 'px', 'left': scoreData.x + 'px'};

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
                            vm.onTimelineFinish({subjectDelta: vm.timelineLinePlus});
                        }

                        _scrolling();
                    }
                };

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
                    currentSubjectId = newVal;
                    _getPromsOrValue().then(function (results) {
                        inProgressProm = results;
                        var estimatedScoresData = results[0];
                        vm.animation = true;
                        vm.timelineLinePlus = false;
                        vm.timeLineData = {
                            data: addIconKey(estimatedScoresData[currentSubjectId]),
                            id: currentSubjectId
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
                        activeExerciseId: '=?'
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
        .run(["$timeout", "$translatePartialLoader", function($timeout, $translatePartialLoader){
            'ngInject';

            $timeout(function(){
                $translatePartialLoader.addPart('performance');
            });
        }]);
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
        .service('PerformanceData', ["$q", "masteryLevel", "StatsSrv", "SubScoreSrv", "SubjectEnum", "TestScoreCategoryEnum", "CategoryService", "StatsQuerySrv", function($q, masteryLevel, StatsSrv, SubScoreSrv, SubjectEnum, TestScoreCategoryEnum, CategoryService, StatsQuerySrv) {
            'ngInject';

            var statsLevelsMap = {
                SUBJECT: 1,
                TEST_SCORE: 2,
                SPECIFIC: 4,
                GENERAL: 3
            };
            var SUBJECTS = 'level1Categories';
            var TESTSCORE = 'level2Categories';
            var GENERAL_CATEGORYS = 'level3Categories';
            var SPECIFIC_CATEGORYS = 'level4Categories';
            var GENERAL_CATEGORY_LEVEL = 3;

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
                    StatsSrv.getLevelStats(statsLevelsMap.TEST_SCORE),
                    StatsSrv.getLevelStats(statsLevelsMap.SPECIFIC)

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
                    StatsSrv.getLevelStats(statsLevelsMap.TEST_SCORE),
                    StatsSrv.getLevelStats(statsLevelsMap.GENERAL)
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
                    var prom = StatsQuerySrv.getWeakestCategoryInLevel(GENERAL_CATEGORY_LEVEL, null, subjectsObj[subjectkey].id);
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

                    _calcSubScoreSpecificCategory(performanceData, allSpecificCategories, stats[SPECIFIC_CATEGORYS]);

                    return _buildWeakestCategory(stats[SUBJECTS], performanceData).then(function (newPerformanceData) {
                        performanceData = _buildTestScore(stats[TESTSCORE], newPerformanceData);
                        return _buildGeneralCategories(stats[GENERAL_CATEGORYS], performanceData).then(function (performanceWithTestScore) {
                            return _buildSpecificCategories(stats[SPECIFIC_CATEGORYS], performanceWithTestScore).then(function (_performanceData) {
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
    "                     ng-if=\"vm.timelineLinePlus\"\n" +
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
    "        <canvas znk-timeline timeline-data=\"vm.timeLineData\" timeline-settings=\"vm.options\"></canvas>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
}]);
