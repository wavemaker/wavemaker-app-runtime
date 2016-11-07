package com.wavemaker.runtime.data.model.queries;

import org.springframework.web.bind.annotation.RequestMethod;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 6/10/16
 */
public enum QueryType {
    INSERT {
        @Override
        public RequestMethod getHttpMethod() {
            return RequestMethod.POST;
        }
    },
    UPDATE {
        @Override
        public RequestMethod getHttpMethod() {
            return RequestMethod.PUT;
        }
    },
    DELETE {
        @Override
        public RequestMethod getHttpMethod() {
            return RequestMethod.DELETE;
        }
    },
    SELECT;

    public RequestMethod getHttpMethod() {
        return RequestMethod.GET;
    }
}
