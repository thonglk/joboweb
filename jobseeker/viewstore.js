"use strict";

app.controller("ViewStoreCtrl", function ($scope, $stateParams, $sce, $rootScope, $http, CONFIG, $timeout, $state) {
    $rootScope.aside = false

    $scope.profileId = $stateParams.id;
    $scope.currentJob = $stateParams.job;


    $scope.admin = $stateParams.admin;

    console.log('admin', $scope.admin)

    $rootScope.service.Ana('viewStore', {storeId: $scope.profileId, jobId: $scope.currentJob})

    if ($scope.profileId) {
        loadStore($scope.profileId)
        init($scope.profileId, $rootScope.userId)

        if (!$rootScope.userId) {
            $rootScope.$on('handleBroadcast', function (event, userData) {
                init($scope.profileId, userData.userId)
                loadStore($scope.profileId)
            });
        }
    }

    function loadStore(profileId) {
        $rootScope.loading = true
        $rootScope.service.JoboApi('view/store', {
            storeId: $scope.profileId,
            userId: $rootScope.userId,
            jobId: $scope.currentJob
        })
            .then(function (response) {
                $timeout(function () {
                    $rootScope.loading = false

                    $scope.profileData = response.data;
                    $scope.jobData = $scope.profileData.jobData;

                    $scope.profileData.background = '/img/ava-background/background_' + $scope.profileData.industry + '.png';
                    if ($scope.currentJob && $scope.profileData.currentJobData) {
                        $scope.currentJobData = $scope.profileData.currentJobData;

                    }
                    var actId = null
                    if ($scope.profileData.act && $scope.profileData.act.actId) {
                        actId = $scope.profileData.act.actId
                    } else {
                        actId = $scope.profileId + ':' + $rootScope.userId + ':' + $scope.currentJob
                    }
                    var likeActivity = db.ref('activity/like/' + actId);
                    likeActivity.on('value', function (data) {
                        $scope.profileData.act = data.val()
                    })
                    $scope.adminData = $scope.profileData.adminData
                    $scope.listReact = $scope.profileData.actData
                    $scope.staticData = $scope.profileData.static
                    $scope.limit = {like: 10, liked: 10, match: 10}
                    $scope.reviewData = $scope.profileData.review
                    if ($scope.reviewData) {
                        $timeout(function () {
                            $scope.ratingModel = $rootScope.service.calReview($scope.reviewData);
                            console.log($scope.ratingModel)
                        })
                    }
                    if ($scope.profileData.storeList) {
                        $scope.storeList = $scope.profileData.storeList
                        $scope.numberStore = Object.keys($scope.storeList).length
                    }

                    $scope.incrementLimit = function (type) {
                        $scope.limit[type] = $scope.listReact[type].length
                    }
                    // for share
                    var profileJobtake = "";
                    for (var i in $scope.profileData.job) {
                        var job = $scope.profileData.job[i]
                        if (job.job != 'other') {
                            profileJobtake += job.job + ", "
                        }
                    }
                    var profileJob = profileJobtake.slice(0, profileJobtake.length - 2)
                    console.log(profileJob);
                    $scope.share = {
                        Url: CONFIG.WEBURL + "/view/profile/" + profileId,
                        Text: $scope.profileData.storeName + ' tuyển dụng',
                        Title: $scope.profileData.industry + ' ' + $scope.profileData.name,
                        Description: 'Xem tin tuyển dụng với vị trí' + profileJob + 'của' + $scope.profileData.storeName,
                        Type: 'feed',
                        Media: $scope.profileData.avatar,
                        Via: '295208480879128',
                        Hashtags: 'jobo,timviecnhanh,pg,sale,model',
                        Caption: 'Có ai muốn làm ' + profileJob + ' không nhỉ? Mình vừa mới tìm thấy tin tuyển dụng này, thử vào Jobo xem thông tin chi tiết rồi cho mình biết bạn nghĩ sao nhé ;) #jobo #timviecnhanh #pg #sale #model'
                    }
                    $rootScope.og = {
                        title: $scope.profileData.storeName + ' tuyển dụng',
                        description: 'Xem tin tuyển dụng với vị trí' + profileJob + 'của' + $scope.profileData.storeName,
                        image: $scope.profileData.avatar
                    }
                })

            }).catch(err => toastr.error(err))


    }


    function init(profileId, userId) {
        if (profileId == $rootScope.storeId) {
            $timeout(function () {
                $scope.myself = true
            })
        }

    }

    $scope.indexCurrent = 0;
    if ($rootScope.usercard) {
        for (var i in $rootScope.usercard) {
            if ($rootScope.usercard[i].userId == $scope.profileId) {
                $scope.indexCurrent = i;
                console.log($scope.indexCurrent)
                break
            }
        }
    }

    $scope.rating = 3;
    $scope.rateFunction = function (rating) {
        $scope.reviews = {
            name: $rootScope.userData.name,
            avatar: $rootScope.userData.avatar || "",
            userId: $rootScope.userId,
            rate: rating,
            type: $rootScope.type,
            createdAt: new Date().getTime(),
            profileId: $scope.profileId

        }
        console.log('Rating selected: ' + rating);
    };
    $scope.review = function (reviews) {
        $rootScope.service.JoboApi('update/review', {
            reviews: reviews
        });
    }


    $scope.$back = function () {
        window.history.back();
    };
    $scope.showVideo = function (user) {
        $scope.showVid = true
        $scope.videoTrusted = $sce.trustAsResourceUrl(user.videourl)
    }
    $scope.hideVideo = function () {
        delete $scope.showVid

    }
    $scope.trustSrc = function (src) {
        return $sce.trustAsResourceUrl(src);
    };

    $scope.nextProfile = function () {
        var next = +$scope.indexCurrent + +1
        console.log(next)
        var nextUserId = $rootScope.storeCard[next].userId
        $state.go('employer.viewprofile', {id: nextUserId})
    }
    $scope.backProfile = function () {
        var back = +$scope.indexCurrent - +1
        console.log(back)
        var backUserId = $rootScope.storeCard[back].userId
        $state.go('employer.viewprofile', {id: backUserId})
    }


    $scope.applyThis = function (id, key) {
        if ($scope.selectedJob && $scope.selectedJob[id] && $scope.selectedJob[id][key]) {
            delete $scope.selectedJob[id][key]
            console.log($scope.selectedJob)
        } else {

            if (!$scope.selectedJob) {
                $scope.selectedJob = {}
            }
            if (!$scope.selectedJob[id]) {
                $scope.selectedJob[id] = {}
            }
            $scope.selectedJob[id][key] = true;
            console.log($scope.selectedJob)

        }
    };


    $scope.shortAddress = function (fullAddress) {
        if (fullAddress) {
            var mixAddress = fullAddress.split(",");
            var address = mixAddress[0] + ', ' + mixAddress[1] + ', ' + mixAddress[2];
            return address
        }

    }


    $scope.chatto = function (id) {
        $state.go("employer.chats", {to: id, slide: 1})
    };

});
