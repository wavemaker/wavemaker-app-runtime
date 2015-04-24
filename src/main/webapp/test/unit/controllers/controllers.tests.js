/*global describe, it, WM, beforeEach, expect*/
describe('Unit: Testing Wavemaker Workspace Controller', function () {
    'use strict';

    var scope, controller, httpBackend;
    /*we'll use this scope in our tests*/

    /*mock Application to allow us to inject our own dependencies*/
    beforeEach(WM.mock.module('wmCore'));
    /*mock the controller for the same reason and include $rootScope and $controller*/
    beforeEach(WM.mock.inject(function ($rootScope, $controller, $httpBackend) {
        /*create an empty scope*/
        scope = $rootScope.$new();
        httpBackend = $httpBackend;
        /*declare the controller and inject our empty scope*/
        controller = $controller('WorkSpaceController', {$scope: scope});

    }));

    it('should have a WorkSpaceController controller', function () {
        expect(controller).toBeDefined();
    });

    it('should have number of workspaces to be 4', function () {
        expect(scope.workSpaces.length).toBe(4);
    });

    it('should delete a workspace', function () {
        scope.closeWorkspace(scope.workSpaces[0]);
        expect(scope.workSpaces.length).toBe(3);
    });

    it('is workspace is active', function () {
        expect(scope.activeWorkSpace).toEqual(scope.workSpaces[0]);
    });
    it("should have number of workspace components 5", function () {
        expect(scope.workspaceComponents.length).toBe(5);
    });
    it("should update workspace components", function () {
        scope.UpdateWorkspaceComponent(scope.workspaceComponents[1]);
        expect(scope.activeWorkSpaceComponent).toEqual(scope.workspaceComponents[1]);
    });

    it("should contain all 4 editor type", function () {
        expect(scope.editorType.hasOwnProperty("html") && scope.editorType.hasOwnProperty("js") && scope.editorType.hasOwnProperty("css") && scope.editorType.hasOwnProperty("java")).toBeTruthy();
    });

});
