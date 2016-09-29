angular.module('BlocksApp').controller('AddressController', function($stateParams, $rootScope, $scope, $http, $location) {
    $scope.$on('$viewContentLoaded', function() {   
        // initialize core components
        App.initAjax();
    });
    var activeTab = $location.url().split('#');
    if (activeTab.length > 1)
      $scope.activeTab = activeTab[1];

    $rootScope.$state.current.data["pageSubTitle"] = $stateParams.hash;
    $scope.addrHash = $stateParams.hash;
    $scope.addr = {"balance": 0, "count": 0};

    //fetch web3 stuff
    $http({
      method: 'POST',
      url: '/web3relay',
      data: {"addr": $scope.addrHash, "options": ["balance", "count", "bytecode"]}
    }).success(function(data) {
      console.log(data)
      $scope.addr = data;
      if (data.isContract) {
        $rootScope.$state.current.data["pageTitle"] = "Contract Address";
        fetchInternalTxs();
      }
    });

    // fetch ethf balance 
    $http({
      method: 'POST',
      url: '/fiat',
      data: {"addr": $scope.addrHash}
    }).success(function(data) {
      console.log(data)
      $scope.addr.ethfiat = data.balance;
    });

    //fetch transactions

    $("#table_txs").DataTable({
      serverSide: true,
      ajax: {
        url: '/addr',
        type: 'POST',
        data: { "$or": [{"action.to": $scope.addrHash}, {"action.from": $scope.addrHash}],
                "action.callType": "call" },
        dataSrc: function(json) {
          $("#table_wait").remove();
          return json;
        }
      },
      "lengthMenu": [
                  [10, 20, 50, 100, 150, -1],
                  [10, 20, 50, 100, 150, "All"] // change per page values here
              ],
      "pageLength": 10, 
      "order": [
          [6, "desc"]
      ],
      "language": {
        "lengthMenu": "_MENU_ transactions",
        "zeroRecords": "No transactions found",
        "infoEmpty": ":(",
        "infoFiltered": "(filtered from _MAX_ total txs)"
      },
      "columnDefs": [ 
        { "name": "transactionHash", "targets": 0},
        { "name": "blockNumber", "targets": 1},
        { "name": "action.from", "targets": 2},
        { "name": "action.to", "targets": 3},
        { "name": "action.value", "targets": 4},
        { "name": "action.gas", "targets": 5},
        { "name": "timestamp", "targets": 6},
        { "data": "transactionHash", "targets": 0},
        { "data": "blockNumber", "targets": 1},
        { "data": "action.from", "targets": 2},
        { "data": "action.to", "targets": 3},
        { "data": "action.value", "targets": 4},
        { "data": "action.gas", "targets": 5},
        { "data": "timestamp", "targets": 6},
        { "targets": [ 5 ], "visible": false, "searchable": false },
        {"type": "date", "targets": 6},
        {"orderable": false, "targets": [0,2,3]},
        { "render": function(data, type, row) {
                      if (data != $scope.addrHash)
                        return '<a href="/addr/'+data+'">'+data+'</a>'
                      else
                        return data
                    }, "targets": [2,3]},
        { "render": function(data, type, row) {
                      return '<a href="/block/'+data+'">'+data+'</a>'
                    }, "targets": [1]},
        { "render": function(data, type, row) {
                      return '<a href="/tx/'+data+'">'+data+'</a>'
                    }, "targets": [0]},
        { "render": function(data, type, row) {
                      return getDuration(data).toString();
                    }, "targets": [6]},
        ]
    });


    var fetchInternalTxs = function() {
      $http({
        method: 'POST',
        url: '/internal',
        data: {"addr": $scope.addrHash}
      }).success(function(data) {
        $("#table_internal_txs").DataTable({
          "data": data,
          "lengthMenu": [
                      [10, 20, 50, 100, 150, -1],
                      [10, 20, 50, 100, 150, "All"] // change per page values here
                  ],
          "pageLength": 10, 
          "order": [
              [6, "desc"]
          ],
          "language": {
            "lengthMenu": "_MENU_ transactions",
            "zeroRecords": "No transactions found",
            "infoEmpty": ":(",
            "infoFiltered": "(filtered from _MAX_ total txs)"
          },
          "columnDefs": [ 
            { "targets": [ 5 ], "visible": false, "searchable": false },
            {"type": "date", "targets": 6},
            {"orderable": false, "targets": [0,2,3]},
            { "render": function(data, type, row) {
                          if (data != $scope.addrHash)
                            return '<a href="/addr/'+data+'">'+data+'</a>'
                          else
                            return data
                        }, "targets": [2,3]},
            { "render": function(data, type, row) {
                          return '<a href="/block/'+data+'">'+data+'</a>'
                        }, "targets": [1]},
            { "render": function(data, type, row) {
                          return '<a href="/tx/'+data+'">'+data+'</a>'
                        }, "targets": [0]},
            { "render": function(data, type, row) {
                          return getDuration(data).toString();
                        }, "targets": [6]},
            ]
        });
        $("#table_int_wait").remove();
      });
    }
})
.directive('contractSource', function($http) {
  return {
    restrict: 'E',
    templateUrl: '/views/contract-source.html',
    scope: false,
    link: function(scope, elem, attrs){
        //fetch contract stuff
        $http({
          method: 'POST',
          url: '/compile',
          data: {"addr": scope.addrHash, "action": "find"}
        }).success(function(data) {
          console.log(data);
          scope.contract = data;
        });
      }
  }
})
