(function (angular) {
    'use strict';

    angular.module('znk.infra-sat.lessonTopic', [
        'znk.infra.exerciseUtility'
    ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra-sat.lessonTopic').service('LessonTopicService', ["SubjectEnum", "LiveSessionSubjectEnum", function (SubjectEnum, LiveSessionSubjectEnum) {
        'ngInject';
        this.getTopicSubjects = function (topicId) {
            var topicSubjects;
            if (topicId === LiveSessionSubjectEnum.ENGLISH.enum) {
                topicSubjects = {
                    essay: SubjectEnum.ESSAY.enum,
                    verbal: SubjectEnum.VERBAL.enum
                };
            } else if (topicId === LiveSessionSubjectEnum.MATH.enum) {
                topicSubjects = {
                    math: SubjectEnum.MATH.enum
                };
            }
            return topicSubjects;
        };
    }]);
})(angular);

angular.module('znk.infra-sat.lessonTopic').run(['$templateCache', function($templateCache) {

}]);
