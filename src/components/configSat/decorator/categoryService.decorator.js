(function () {
    'use strict';

    angular.module('znk.infra-sat.configSat')
        .decorator('CategoryService', function ($delegate, $q, EnumSrv, categoryEnum) {
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
                    if (categoryEnum.LEVEL2.enum === category.typeId) {
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
        });
})();
