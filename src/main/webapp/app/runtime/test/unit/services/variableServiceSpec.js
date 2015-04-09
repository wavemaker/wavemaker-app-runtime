/*global describe, it, WM, beforeEach, module, inject, expect, spyOn*/
describe('Unit: Testing WaveMaker Variable-related services', function () {
    'use strict';
    var baseVariableService, fileService;
    beforeEach(function () {
        module('wm.variables');
        module('wmCore');

        module(function ($provide) {
            $provide.value('$routeParams', {"project_name": "test"});
        });

        inject(function ($injector, FileService) {
            baseVariableService = $injector.get('Variables');
            fileService = FileService;
            spyOn(fileService, "read");
            spyOn(fileService, "write");
        });
    });

    describe('\n\tUnit: Testing WaveMaker Base Service (Variables)', function () {
        it('create() will create and store a basic variable', WM.mock.inject(function () {
            baseVariableService.create('wm.Variable', {"name": "testBasicVariable"});
            expect(baseVariableService.isExists('testBasicVariable')).toBeTruthy();
        }));
    });
});
