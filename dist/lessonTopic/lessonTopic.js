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
