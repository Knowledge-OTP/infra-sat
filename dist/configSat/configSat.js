(function (angular) {
    'use strict';

    angular.module('znk.infra-sat.configSat', []);
})(angular);

(function () {
    'use strict';

    angular.module('znk.infra-sat.configSat')
        .decorator('CategoryService', ["$delegate", "$q", "EnumSrv", function ($delegate, $q, EnumSrv) {
            'ngInject';

            var categoryService = $delegate;
            var categoryTypeEnum = new EnumSrv.BaseEnum([
                ['TUTORIAL', 1, 'tutorial'],
                ['EXERCISE', 2, 'exercise'],
                ['MINI_CHALLENGE', 3, 'miniChallenge'],
                ['SECTION', 4, 'section'],
                ['DRILL', 5, 'drill'],
                ['GENERAL', 6, 'general'],
                ['SPECIFIC', 7, 'specific'],
                ['STRATEGY', 8, 'strategy'],
                ['SUBJECT', 9, 'subject'],
                ['SUB_SCORE', 10, 'subScore'],
                ['TEST_SCORE', 11, 'testScore']
            ]);

            categoryService.getSubjectIdByCategory = function (category) {
                if (category.typeId === categoryTypeEnum.SUBJECT.enum) {
                    return $q.when(category.id);
                }
                return categoryService.getParentCategory(category.id).then(function (parentCategory) {
                    return categoryService.getSubjectIdByCategory(parentCategory);
                });
            };

            categoryService.getTestScore = function (categoryId) {
                return categoryService.getCategoryMap().then(function (categories) {
                    var category = categories[categoryId];
                    if (categoryTypeEnum.TEST_SCORE.enum === category.typeId) {
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
                                if (category.typeId === categoryTypeEnum.GENERAL.enum) {
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
                                if (category.typeId === categoryTypeEnum.SPECIFIC.enum) {
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
                if (category.typeId === categoryTypeEnum.SUBJECT.enum) {
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
        }]);
})();

angular.module('znk.infra-sat.configSat').run(['$templateCache', function($templateCache) {

}]);
