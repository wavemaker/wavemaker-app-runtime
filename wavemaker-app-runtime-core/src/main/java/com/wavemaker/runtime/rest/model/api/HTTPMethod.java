/**
 * Copyright (c) 2013 - 2014 WaveMaker, Inc. All Rights Reserved.
 *
 * This software is the confidential and proprietary information of WaveMaker, Inc.
 * You shall not disclose such Confidential Information and shall use it only in accordance
 * with the terms of the source code license agreement you entered into with WaveMaker, Inc.
 */
package com.wavemaker.runtime.rest.model.api;

/**
 * @author kayalv
 */

public enum HTTPMethod {

    GET(1),
    POST(2),
    DELETE(3),
    PUT(4),
    PATCH(5),
    OPTIONS(6),
    HEAD(7),
    TRACE(8),
    CONNECT(9);

    private int id;

    HTTPMethod(int id) {
        this.id = id;
    }

    public int getId() {
        return id;
    }

    public HTTPMethod getHTTPMethod(int id) {

        HTTPMethod httpMethod = null;
        for (HTTPMethod method : values()) {
            if (method.getId() == id) {
                httpMethod = method;
                break;
            }
        }
        return httpMethod;
    }
}
