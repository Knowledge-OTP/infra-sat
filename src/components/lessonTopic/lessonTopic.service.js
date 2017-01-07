(function (angular) {
    'use strict';

    angular.module('znk.infra-sat.lessonTopic').service('LessonTopicService', function (SubjectEnum, LiveSessionSubjectEnum) {
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
    });
})(angular);
