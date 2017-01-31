/**
 * Copyright © 2013 - 2017 WaveMaker, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
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
    SELECT {
        @Override
        public boolean isReadOnly() {
            return true;
        }
    };

    public RequestMethod getHttpMethod() {
        return RequestMethod.GET;
    }

    public boolean isReadOnly() {
        return false;
    }
}
