(function (angular) {
    'use strict';

    angular.module('znk.infra-sat.userGoals')
        .service('UserGoalsService', function (InfraConfigSrv, StorageSrv, ENV, $q) {
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
        });
})(angular);
