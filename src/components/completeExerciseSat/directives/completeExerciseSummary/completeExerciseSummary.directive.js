/**
 * attrs:
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra-sat.completeExerciseSat').component('completeExerciseSummary', {
        templateUrl: 'components/completeExerciseSat/directives/completeExerciseSummary/completeExerciseSummaryDirective.template.html',
        require: {
            completeExerciseCtrl: '^completeExercise'
        },
        controller: function () {
            'ngInject';

            var $ctrl = this;

            function _initSuccessGauge(){
                var exerciseResult = $ctrl.completeExerciseCtrl.getExerciseResult();
                var exerciseContent = $ctrl.completeExerciseCtrl.getExerciseContent();

                $ctrl.performanceChart = {};
                $ctrl.performanceChart.gaugeSettings = {
                    labels: ['Correct', 'Wrong', 'Unanswered'],
                    data: [
                        exerciseResult.correctAnswersNum,
                        exerciseResult.wrongAnswersNum,
                        exerciseResult.skippedAnswersNum
                    ],
                    colours: ['#87ca4d', '#ff6766', '#ebebeb'],
                    options: {
                        segmentShowStroke: false,
                        percentageInnerCutout: 85,
                        showTooltips: false,
                        animation: false
                    }
                };

                var totalQuestionsNum = exerciseContent.questions.length;
                var totalCorrectNum = exerciseResult.correctAnswersNum || 0;
                $ctrl.performanceChart.successRate = parseInt(totalCorrectNum/totalQuestionsNum * 100);
            }

            function _initStats(){
                var exerciseResult = $ctrl.completeExerciseCtrl.getExerciseResult();
                var exerciseContent = $ctrl.completeExerciseCtrl.getExerciseContent();

                $ctrl.statsTime = {};
                var avgTimePropToConvertToSeconds = ['correct', 'wrong'];
                avgTimePropToConvertToSeconds.forEach(function(avgTimeProp){
                    var avgTimePropInResultObj = avgTimeProp + 'AvgTime';
                    $ctrl.statsTime[avgTimePropInResultObj] = parseInt(exerciseResult[avgTimePropInResultObj] / 1000);
                });
                // $ctrl.statsTime = {
                //     correctAvgTime: parseInt(exerciseResult.correctAvgTime / 1000),
                //     wrongAvgTime: parseInt(exerciseResult.correctAvgTime / 1000),
                //     rrectAvgTime: parseInt(exerciseResult.correctAvgTime / 1000)
                // };
            }

            this.$onInit = function(){
                _initSuccessGauge();

                _initStats();

                this.exerciseResult = $ctrl.completeExerciseCtrl.getExerciseResult();
                this.exerciseContent = $ctrl.completeExerciseCtrl.getExerciseContent();
            };
        }
    });
})(angular);

