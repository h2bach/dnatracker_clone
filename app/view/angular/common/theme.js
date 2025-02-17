"use strict";

(function ($) {

    angular.module('dna-tracker.common.theme', [])
        .factory("IsMobile", function () {
            var isMobile = false;
            if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent)
                || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0, 4))) isMobile = true;
            return isMobile;
        })

        .filter('slice', function () {
            return function (arr, start, limit) {
                return (arr || []).slice(start, start + limit);
            }
        })

        .directive("onEnter", function () {
            return {
                restrict: "A",
                link: function ($scope, elem, attrs) {
                    elem.keydown(function (keyEvent) {
                        if (keyEvent.keyCode == 13) {
                            $scope.$apply(attrs.onEnter);
                        }
                    })
                }
            };
        })

        .directive("fileInputForm", function ($parse) {
            return {
                restrict: "E",
                link: function ($scope, elem, attrs) {
                    var model = $parse(attrs.ngModel);

                    var randomId = StringUtil.randomId(8);
                    var $form = $('<form><input id=' + randomId + ' type="file" style="display: none" name="file" accept="text/*,.fa,.fasta"/></form>');
                    var  $fileInput = $form.find("input#"+randomId);
                    elem.append($fileInput);
                    var btnContent = '<div class="btn-group">'
                            + '<button href="" class="btn btn-success btn-xl btn-text" style="border-right: 1px solid rgba(0,0,0,0.1) !important; font-size: 14px; text-transform: none;">' + attrs.title + '</button>'
                            + '<button class="btn btn-success btn-xl btn-delete" style="border-left: 1px solid rgba(0,0,0,0.1) !important; font-size: 14px; padding: 15px 20px 15px 15px;"><i class="fa fa-times"></i></button>'
                        +'</div>';
                    var $btn = $(btnContent);
                    elem.append($btn);

                    var setBtnText = function (file_name) {
                        $btn.find(".btn-text").text(file_name.length <= 35 ? file_name : file_name.substr(0, 30) + "...");
                    };

                    if (model($scope)) {
                        setBtnText(model($scope).name);
                    }

                    var clearForm = function () {
                        model.assign($scope, null);
                        setBtnText(attrs.title);
                    };

                    $btn.find(".btn-text").click(function () {
                        $fileInput.click();
                    });

                    var $btnDelete = $btn.find(".btn-delete");

                    $btnDelete.click(function () {
                        $scope.$applyAsync(function () {
                            $fileInput.wrap('<form>').parent('form').trigger('reset');
                            $fileInput.unwrap();
                            clearForm();
                        });
                    });

                    $scope.$watch(attrs.disabled, function (value) {
                        $btn.attr("disabled", value);
                    }, false);

                    $scope.$watch(function () {
                        return Cols.isEmpty($fileInput[0].files);
                    }, function (isEmpty) {
                        $btnDelete.attr("disabled", isEmpty);
                    });

                    $fileInput.bind('change', function () {
                        $scope.$applyAsync(function () {
                            if (Cols.isNotEmpty($fileInput[0].files)) {
                                model.assign($scope, $fileInput[0].files[0]);
                                setBtnText($fileInput[0].files[0].name);
                            } else {
                                clearForm();
                            }
                        });
                    });
                }
            };
        })

        .directive('fotorama', [
            function () {
                return {
                    template: '<div class="fotorama"></div>',
                    replace: true,
                    restrict: 'E',
                    scope: {
                        options: '=',
                        items: '='
                    },
                    link: function ($scope, element, attrs) {
                        $scope.$watch('items', function (items) {
                            _.forEach(items, function (item) {
                                $('<a href="' + item.img + '"><img src="' + item.thumb + '"></a>').appendTo(element);
                            });
                            var $fotoramaDiv = $('.fotorama').fotorama();
                            $fotoramaDiv.data('fotorama').setOptions($scope.options);
                        });
                    }
                };
            }
        ])

        .directive('backgroundImg', function () {
            return function (scope, element, attrs) {
                attrs.$observe('backgroundImg', function (url) {
                    element.css({
                        'background-image': 'url(' + url + ')'
                    });
                });
            };
        })

        .filter('momentFormat', function () {
            return function (timestamp) {
                var momentTime = moment(timestamp);
                var isToday = momentTime.isSame(Date(), 'day') && momentTime.isSame(Date(), 'year') && momentTime.isSame(Date(), 'month');
                return isToday ? momentTime.locale("de").format('[Hôm nay], h:mm:ss a') : momentTime.format('LLL');
            }
        })

        .filter('noData', function () {
            return function (data) {
                if (_.isEmpty(data) || data.length == 0) {
                    return "Chưa có dữ liệu";
                }
                return data;
            }
        })

        .directive("printBtn", function() {
            return {
                restrict: "A",
                link: function($scope, elem, attrs) {
                    elem.click(function () {
                        $(attrs.printBtn).printThis();
                    })
                }
            };
        })

    ;

})(jQuery);