(function (angular) {
    'use strict';

    angular.module('znk.infra-sat.configSat')
        .config(function (LiveSessionSubjectSrvProvider, LiveSessionSubjectConst) {
        'ngInject';
        var topics = [LiveSessionSubjectConst.MATH, LiveSessionSubjectConst.ENGLISH];
        LiveSessionSubjectSrvProvider.setLiveSessionTopics(topics);

    });
})(angular);
