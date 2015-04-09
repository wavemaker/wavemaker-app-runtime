/*globals describe:true,it:true,inject:true,expect:true,beforeEach:true,runs:true,
 waitsFor:true,module:true,dump:true */
describe('wmCommand provider', function () {
    'use strict';

    beforeEach(function () {
        module('wmCommand.provider');
    });

    beforeEach(inject(function (wmCommand) {
        this.command = wmCommand;
    }));

    it('starts with empty stack when just being injected', function () {
        expect(this.command.isDirty()).toBeFalsy();
    });

    it('initially sets undo as not possible', function () {
        expect(this.command.isUndoPossible()).toBeFalsy();
    });

    it('initially sets redo as not possible', function () {
        expect(this.command.isRedoPossible()).toBeFalsy();
    });

    describe('it should work with a controller', function () {
        var scope, Controller;
        beforeEach(inject(function ($rootScope) {
            scope = $rootScope.$new();
        }));

        Controller = function ($scope, wmCommand) {
            $scope.a = "init";
            return {
                testTask1: function () {
                    wmCommand.execute(this, "test1", {"testData": 12});
                },
                test1: function () {
                    $scope.a = "test1";
                },
                testTask2: function () {
                    wmCommand.execute(this, "test2", {"testData": 21});
                },
                test2: function () {
                    $scope.a = "test2";
                },
                savePreState: function (name, data) {
                    var prefix = "pre State :";
                   /* switch (name) {
                    case "test1":
                        dump(prefix + "test1--" + JSON.stringify(data));
                        break;
                    case "test2":
                        dump(prefix + "test2--" + JSON.stringify(data));
                        break;
                    default:
                        dump(prefix + "no such function " + name);
                        break;
                    }*/
                    return {};
                },
                savePostState: function (name, data) {
                    var prefix = "post State :";
                    /*switch (name) {
                    case "test1":
                        dump(prefix + "test1--" + JSON.stringify(data));
                        break;
                    case "test2":
                        dump(prefix + "test2--" + JSON.stringify(data));
                        break;
                    default:
                        dump(prefix + "no such function " + name);
                        break;
                    }*/
                    return {};
                },
                undo: function (name, data) {
                    var prefix = "undo ";
                    $scope.a = prefix + name;
                },
                redo: function (name, data) {
                    var prefix = "redo ";
                    $scope.a = prefix + name;
                }
            };
        };

        it('should do nothing on undo when no task has been executed', function () {
            expect(this.command.isUndoPossible()).toBeFalsy();
            expect(this.command.isRedoPossible()).toBeFalsy();
            expect(this.command.isDirty()).toBeFalsy();

            this.command.undo();

            expect(this.command.isUndoPossible()).toBeFalsy();
            expect(this.command.isRedoPossible()).toBeFalsy();
            expect(this.command.isDirty()).toBeFalsy();
        });

        it('should do nothing on redo when no task has been executed', function () {
            expect(this.command.isUndoPossible()).toBeFalsy();
            expect(this.command.isRedoPossible()).toBeFalsy();
            expect(this.command.isDirty()).toBeFalsy();

            this.command.redo();

            expect(this.command.isUndoPossible()).toBeFalsy();
            expect(this.command.isRedoPossible()).toBeFalsy();
            expect(this.command.isDirty()).toBeFalsy();
        });


        it('executing a task should result in adding it to undoStack', function () {
            expect(this.command.isUndoPossible()).toBeFalsy();
            expect(this.command.isRedoPossible()).toBeFalsy();

            var ctrl = new Controller(scope, this.command);
            expect(scope.a).toBe("init");
            ctrl.testTask1();
            expect(scope.a).toBe("test1");
            expect(this.command.isUndoPossible()).toBeTruthy();
            expect(this.command.isDirty()).toBeTruthy();
            expect(this.command.isRedoPossible()).toBeFalsy();
            expect(this.command.getLastUndo()).toBe("test1");
        });

        it('should reset the stack and state on calling reset', function () {
            var ctrl = new Controller(scope, this.command);
            ctrl.testTask1();
            this.command.reset();
            expect(this.command.isUndoPossible()).toBeFalsy();
            expect(this.command.isDirty()).toBeFalsy();
            expect(this.command.isRedoPossible()).toBeFalsy();
        });

        it('should do nothing on redo when undo is not called even once', function () {
            this.command.reset();

            var ctrl = new Controller(scope, this.command);
            expect(scope.a).toBe("init");
            ctrl.testTask1();
            expect(scope.a).toBe("test1");
            this.command.redo();
            expect(this.command.isUndoPossible()).toBeTruthy();
            expect(this.command.isRedoPossible()).toBeFalsy();
        });

        it('undo should result in adding a task to redoStack, calling the internal undo method and reset state', function () {
            this.command.reset();

            var ctrl = new Controller(scope, this.command);
            ctrl.testTask1();
            this.command.undo();
            expect(scope.a).toBe("undo test1");
            expect(this.command.isUndoPossible()).toBeFalsy();
            expect(this.command.isRedoPossible()).toBeTruthy();
            expect(this.command.isDirty()).toBeFalsy();
        });

        it('redo should result in adding a task to undoStack, calling the internal redo method and setting state to dirty', function () {
            this.command.reset();

            var ctrl = new Controller(scope, this.command);
            ctrl.testTask1();

            this.command.undo();
            expect(this.command.getLastRedo()).toBe("test1");

            this.command.redo();

            expect(scope.a).toBe("redo test1");
            expect(this.command.isUndoPossible()).toBeTruthy();
            expect(this.command.isRedoPossible()).toBeFalsy();
            expect(this.command.isDirty()).toBeTruthy();
        });

        it('should set reset state when equal number of task executions and undo calls are made without reset', function () {
            this.command.reset();

            var ctrl = new Controller(scope, this.command);
            ctrl.testTask1();
            ctrl.testTask1();
            ctrl.testTask1();

            expect(this.command.isDirty()).toBeTruthy();
            this.command.undo();
            this.command.undo();
            this.command.undo();

            expect(this.command.isDirty()).toBeFalsy();
        });

        it('should set state to dirty when equal number of task executions,undo calls and redo calls are made without reset', function () {
            this.command.reset();

            var ctrl = new Controller(scope, this.command);
            ctrl.testTask1();
            ctrl.testTask1();
            ctrl.testTask1();

            expect(this.command.isDirty()).toBeTruthy();
            this.command.undo();
            this.command.undo();
            this.command.undo();

            expect(this.command.isDirty()).toBeFalsy();
            this.command.redo();
            this.command.redo();
            this.command.redo();

            expect(this.command.isDirty()).toBeTruthy();
        });

        it('should undo tasks in an order - last one first', function () {
            this.command.reset();

            var ctrl = new Controller(scope, this.command);
            ctrl.testTask1();
            ctrl.testTask2();
            ctrl.testTask1();

            expect(this.command.getLastUndo()).toBe("test1");
            this.command.undo();

            expect(this.command.getLastUndo()).toBe("test2");
            this.command.undo();

            expect(this.command.getLastUndo()).toBe("test1");
            this.command.undo();

        });

        it('should redo tasks in an order - last one first', function () {
            this.command.reset();

            var ctrl = new Controller(scope, this.command);
            ctrl.testTask2();
            ctrl.testTask2();
            ctrl.testTask1();

            this.command.undo();
            this.command.undo();
            this.command.undo();

            expect(this.command.getLastRedo()).toBe("test2");
            this.command.redo();

            expect(this.command.getLastRedo()).toBe("test2");
            this.command.redo();

            expect(this.command.getLastRedo()).toBe("test1");
            this.command.redo();

        });

        it('should disable redo if an undo is followed by another task', function () {
            this.command.reset();

            var ctrl = new Controller(scope, this.command);
            ctrl.testTask1();
            this.command.undo();

            ctrl.testTask2();
            expect(this.command.getLastUndo()).toBe("test2");

            expect(this.command.isRedoPossible()).toBeFalsy();
        });

        it('should enable redo if a second task is executed after undo of first task', function () {
            this.command.reset();

            var ctrl = new Controller(scope, this.command);
            ctrl.testTask1();
            this.command.undo();
            ctrl.testTask2();
            expect(this.command.getLastUndo()).toBe("test2");
            this.command.undo();
            expect(this.command.isRedoPossible()).toBeTruthy();
            this.command.redo();
            expect(this.command.isUndoPossible()).toBeTruthy();
        });
    });
});