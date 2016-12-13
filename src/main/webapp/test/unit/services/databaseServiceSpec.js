/*global describe, jasmine, it, WM, module, beforeEach, expect, spyOn*/
describe("Database plugin module", function () {
    "use strict";

    beforeEach(function () {
        WM.mock.module("wmCore");
        WM.mock.module("wm.plugins.database");
    });

    describe("\n\tDatabase Controller", function () {

        var scope,
            databaseController,
            dialogService;

        beforeEach(function () {
            WM.mock.inject(function ($rootScope, $controller, DialogService) {
                dialogService = DialogService;
                scope = $rootScope.$new();
                databaseController = $controller("wm.plugins.database.controllers.DatabaseController", {$scope: scope});
            });
        });

        it("should contain a Database controller", function () {
            expect(databaseController).toBeDefined();
        });

        it("should update the connection settings based on the specified parameters", function () {
            expect(scope.database).toBeDefined();
            scope.database.databaseSystem = "MySQL";
            scope.database.importDatabaseName = "test";
            scope.database.host = "localhost";
            scope.database.port = "3306";
            scope.updateConnectionSettings();
            expect(scope.database.serviceId).toBe("test");
            expect(scope.database.packageName).toBe("com.test");
            expect(scope.database.connectionUrl).toBe("jdbc:mysql://localhost:3306/test?useUnicode=yes&characterEncoding=UTF-8&zeroDateTimeBehavior=convertToNull");
        });
    });

    describe("\n\tDatabase service", function () {

        var targetService = "Database",
            projectID = "TestProject",
            userName = "root",
            connectionUrl = "jdbc:mysql://localhost:3306/test1?useUnicode=yes&characterEncoding=UTF-8&zeroDateTimeBehavior=convertToNull",
            baseService,
            databaseService,
            result,
            callbacks = {
                "success": function () {
                    result = true;
                },
                "failure": function () {
                    result = false;
                }
            };

        beforeEach(function () {
            WM.mock.inject(function (DatabaseService, BaseService) {
                databaseService = DatabaseService;
                baseService = BaseService;

                spyOn(baseService, "execute");
            });
        });

        it("should contain a DatabaseService service", function () {
            expect(databaseService).toBeDefined();
        });

        it("should have a working DatabaseService service with all the methods defined", function () {
            var anyFunction = jasmine.any(Function);

            expect(databaseService.importSample).toEqual(anyFunction);
            expect(databaseService.testConnection).toEqual(anyFunction);
            expect(databaseService.importDB).toEqual(anyFunction);
        });

        it("should import the WaveMaker sample database", function () {

            var params = {
                    target: targetService,
                    action: "importSample",
                    data: {
                        "projectId": projectID,
                        "action": "importSampleDatabase"
                    }
                };

            databaseService.importSample(projectID, callbacks.success, callbacks.failure);
            expect(baseService.execute).toHaveBeenCalledWith(params, callbacks.success, callbacks.failure);
        });

        it("should test the connection to any specified database", function () {

            var params = {
                    projectID: projectID,
                    userName: userName,
                    password: "",
                    connectionUrl: connectionUrl,
                    driverClassName: null,
                    dialectClassName: null
                },
                requestParams = {
                    target: targetService,
                    action: "testConnection",
                    data: {
                        "projectId": params.projectID,
                        "action": "testDBConnection",
                        "databaseDetails": {
                            "username": params.userName,
                            "password": params.password,
                            "connectionUrl": params.connectionUrl,
                            "driverClassName": params.driverClassName,
                            "dialectClassName": params.dialectClassName
                        }
                    }
                };

            databaseService.testConnection(params, callbacks.success, callbacks.failure);
            expect(baseService.execute).toHaveBeenCalledWith(requestParams, callbacks.success, callbacks.failure);
        });

        it("should import any specified database", function () {

            var params = {
                    projectID: projectID,
                    serviceId: "",
                    packageName: "",
                    userName: userName,
                    password: "",
                    connectionUrl: connectionUrl,
                    tableFilter: [],
                    schemaFilter: "",
                    driverClassName: null,
                    dialectClassName: null,
                    revengNamingStrategyClassName: "",
                    impersonateUser: false,
                    activeDirectoryDomain: ""
                },
                requestParams = {
                    target: targetService,
                    action: "importDB",
                    data: {
                        "projectId": params.projectID,
                        "action": "importDatabase",
                        "databaseDetails": {
                            "serviceId": params.serviceId,
                            "packageName": params.packageName,
                            "username": params.userName,
                            "password": params.password,
                            "connectionUrl": params.connectionUrl,
                            "tableFilter": params.tableFilter,
                            "schemaFilter": params.schemaFilter,
                            "driverClassName": params.driverClassName,
                            "dialectClassName": params.dialectClassName,
                            "revengNamingStrategyClassName": params.revengNamingStrategyClassName,
                            "impersonateUser": params.impersonateUser,
                            "activeDirectoryDomain": params.activeDirectoryDomain
                        }
                    }
                };

            databaseService.importDB(params, callbacks.success, callbacks.failure);
            expect(baseService.execute).toHaveBeenCalledWith(requestParams, callbacks.success, callbacks.failure);
        });
    });
});
