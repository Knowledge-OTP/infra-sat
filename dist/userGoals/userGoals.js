(function (angular) {
    'use strict';

    angular.module('znk.infra-sat.userGoals', [
        'znk.infra.auth'
    ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra-sat.userGoals')
        .service('UserGoalsService', ["StorageFirebaseAdapter", "StorageSrv", "ENV", "$q", "AuthService", function (StorageFirebaseAdapter, StorageSrv, ENV, $q, AuthService) {
            'ngInject';

            var fbAdapter = new StorageFirebaseAdapter(ENV.fbDataEndPoint);
            var config = {
                variables: {
                    uid: AuthService.getAuth().uid
                }
            };
            var storage = new StorageSrv(fbAdapter, config);
            var goalsPath = StorageSrv.variables.appUserSpacePath + '/goals';
            var defaultSubjectScore = 600;
            var self = this;

            this.getGoals = function () {
                return storage.get(goalsPath).then(function (userGoals) {
                    if (angular.equals(userGoals, {})) {
                        userGoals = _defaultUserGoals();
                    }
                    return userGoals;
                });
            };

            this.setGoals = function (newGoals) {
                if (arguments.length && angular.isDefined(newGoals)) {
                    return storage.set(goalsPath, newGoals);
                }
                return storage.get(goalsPath).then(function (userGoals) {
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
            };

            this.calcCompositeScore = function (userSchools, save) {
                // The calculation for composite score in ACT:
                // 1. For each school in US, we have min & max score
                // 2. Calc the average score for each school and set it for each subject goal

                return this.getGoals().then(function (userGoals) {
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

                    userGoals.totalScore = averageSubjectsGoal(userGoals);
                    var prom = save ? self.setGoals(userGoals) : $q.when(userGoals);
                    return prom;
                });
            };

            function _defaultUserGoals() {
                return {
                    isCompleted: false,
                    verbal: defaultSubjectScore,
                    math: defaultSubjectScore,
                    totalScore: defaultSubjectScore * 2
                };
            }

            function averageSubjectsGoal(goals) {
                var math = goals.math || defaultSubjectScore;
                var verbal = goals.english || defaultSubjectScore;
                return Math.round((math + verbal) / 2);
            }
        }]);
})(angular);

angular.module('znk.infra-sat.userGoals').run(['$templateCache', function($templateCache) {

}]);
