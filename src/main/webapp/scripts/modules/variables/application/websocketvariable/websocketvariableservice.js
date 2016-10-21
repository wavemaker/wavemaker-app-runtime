/*global wm, WM, _*/
/*jslint todo: true */
/*jslint sub: true */


/**
 * @ngdoc service
 * @name wm.variables.$websocketvariable
 * @requires $rootScope
 * @requires BaseVariablePropertyFactory
 * @description
 * The '$websocketvariable' provides methods to work with web socket variables
 */

wm.variables.services.$websocketvariable = ['BaseVariablePropertyFactory', 'Variables', 'VARIABLE_CONSTANTS', '$websocket', 'Utils',
    function (BaseVariablePropertyFactory, Variables, VARIABLE_CONSTANTS, $websocket, Utils) {
        "use strict";

        var scope_var_socket_map = {},
            initiateCallback = Variables.initiateCallback,
            serviceVariableObj;

        /**
         * returns the state of property to decide weather to append new messages to dataSet or not
         * @param variable
         * @returns {appendData}
         */
        function shouldAppendData(variable) {
            return variable.appendData;
        }

        /**
         * clears the socket variable against the variable in a scope
         * @param variable
         */
        function freeSocket(variable) {
            _.set(scope_var_socket_map, [variable.activeScope.$id, variable.name], undefined);
        }

        /**
         * calls the ON_OPEN event on the variable
         * this is called once the connection is established by the variable with the target WebSocket service
         * @param variable
         * @param evt
         * @private
         */
        function _onSocketOpen(variable, evt) {
            variable._socketConnected = true;
            // EVENT: ON_OPEN
            initiateCallback(VARIABLE_CONSTANTS.EVENT.OPEN, variable, variable.activeScope, _.get(evt, 'data'), evt);
        }

        /**
         * calls the ON_CLOSE event on the variable
         * this is called on close of an existing connection on a variable
         * @param variable
         * @param evt
         * @private
         */
        function _onSocketClose(variable, evt) {
            variable._socketConnected = false;
            freeSocket(variable);
            // EVENT: ON_CLOSE
            initiateCallback(VARIABLE_CONSTANTS.EVENT.CLOSE, variable, variable.activeScope, _.get(evt, 'data'), evt);
        }

        /**
         * calls the ON_ERROR event on the variable
         * this is called if an error occurs while connecting to the socket service
         * @param variable
         * @param evt
         * @private
         */
        function _onSocketError(variable, evt) {
            variable._socketConnected = false;
            freeSocket(variable);
            // EVENT: ON_ERROR
            initiateCallback(VARIABLE_CONSTANTS.EVENT.ERROR, variable, variable.activeScope, _.get(evt, 'data'), evt);
        }

        /**
         * handler for onMessage event on a socket connection for a variable
         * the data returned is converted to JSON from string/xml and assigned to dataSet of variable
         * If not able to do so, message is simply assigned to the dataSet of variable
         * If appendData property is set, the message is appended to the dataSet, else it replaces the existing value of dataSet
         * @param variable
         * @param evt
         * @private
         */
        function _onSocketMessage(variable, evt) {
            var data = _.get(evt, 'data'), value;
            data = Utils.getValidJSON(data) || Utils.xmlToJson(data) || data;
            // EVENT: ON_MESSAGE
            value = initiateCallback(VARIABLE_CONSTANTS.EVENT.MESSAGE_RECEIVE, variable, variable.activeScope, data, evt);
            data = WM.isDefined(value) ? value : data;
            if (shouldAppendData(variable)) {
                variable.dataSet = variable.dataSet || [];
                variable.dataSet.push(data);
            } else {
                variable.dataSet = WM.isDefined(value) ? value : data;
            }
        }

        /**
         * calls the ON_BEFORE_SEND callback on the variable
         * @param variable
         * @param message
         * @returns {*}
         * @private
         */
        function _onBeforeSend(variable, message) {
            // EVENT: ON_BEFORE_SEND
            return initiateCallback(VARIABLE_CONSTANTS.EVENT.BEFORE_SEND, variable, variable.activeScope, message);
        }

        /**
         * calls the ON_BEFORE_CLOSE callback assigned to the variable
         * @param variable
         * @param evt
         * @returns {*}
         * @private
         */
        function _onBeforeSocketClose(variable, evt) {
            // EVENT: ON_BEFORE_CLOSE
            return initiateCallback(VARIABLE_CONSTANTS.EVENT.BEFORE_CLOSE, variable, variable.activeScope, _.get(evt, 'data'), evt);
        }

        /**
         * calls the ON_BEFORE_OPEN callback assigned
         * called just before the connection is open
         * @param variable
         * @param evt
         * @returns {*}
         * @private
         */
        function _onBeforeSocketOpen(variable, evt) {
            // EVENT: ON_BEFORE_OPEN
            return initiateCallback(VARIABLE_CONSTANTS.EVENT.BEFORE_OPEN, variable, variable.activeScope, _.get(evt, 'data'), evt);
        }

        /**
         * get url from wmServiceOperationInfo
         * @param variable
         * @returns {*}
         */
        function getURL(variable) {
            return variable._wmServiceOperationInfo.directPath;
        }

        /**
         * returns an existing socket connection on the variable
         * if not present, make the connection and return it
         * @param variable
         * @returns {*}
         */
        function getSocket(variable) {
            var url     = getURL(variable),
                _socket = _.get(scope_var_socket_map, [variable.activeScope.$id, variable.name]);
            if (_socket) {
                return _socket;
            }

            _socket = $websocket(url);
            _socket.onOpen(_onSocketOpen.bind(undefined, variable));
            _socket.onError(_onSocketError.bind(undefined, variable));
            _socket.onMessage(_onSocketMessage.bind(undefined, variable));
            _socket.onClose(_onSocketClose.bind(undefined, variable));

            _.set(scope_var_socket_map, [variable.activeScope.$id, variable.name], _socket);
            variable._socket = _socket;
            return _socket;
        }

        /**
         * opens a socket connection on the variable.
         * URL & other meta data is fetched from wmServiceOperationInfo
         * @returns {*}
         */
        function open() {
            var variable    = this,
                shouldOpen = _onBeforeSocketOpen(variable),
                socket;
            if (shouldOpen === false) {
                return;
            }
            socket = getSocket(variable);
            return socket;
        }

        /**
         * closes an existing socket connection on variable
         */
        function close() {
            var variable    = this,
                shouldClose = _onBeforeSocketClose(variable),
                socket      = getSocket(variable);
            if (shouldClose === false) {
                return;
            }
            socket.close();
        }

        /**
         * sends a message to the existing socket connection on the variable
         * If socket connection not open yet, open a connections and then send
         * if message provide, it is sent, else the one present in RequestBody param is sent
         * @param message
         */
        function send(message) {
            var variable    = this,
                socket      = getSocket(variable),
                response;

            message = message || _.get(variable, 'dataBinding.RequestBody');
            response = _onBeforeSend(variable, message);
            if (response === false) {
                return;
            }
            message = WM.isDefined(response) ? response : message;
            socket.send(message);
        }

        /* properties of a service variable - should contain methods applicable on this particular object */
        serviceVariableObj = {
            open    : open,
            close   : close,
            send    : send,
            invoke  : send
        };

        /* register the variable to the base service */
        BaseVariablePropertyFactory.register('wm.WebSocketVariable', serviceVariableObj, [], serviceVariableObj);

        return {};
    }];
