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

angular.module('znk.infra-sat.configSat').run(['$templateCache', function ($templateCache) {
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
