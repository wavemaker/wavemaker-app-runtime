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
package com.wavemaker.runtime.data.spring;

import java.util.UUID;

import org.springframework.beans.factory.config.PropertyPlaceholderConfigurer;

import com.wavemaker.commons.util.StringUtils;
import com.wavemaker.commons.util.SystemUtils;
import com.wavemaker.runtime.WMAppContext;
import com.wavemaker.runtime.data.util.DataServiceConstants;
import com.wavemaker.runtime.data.util.DataServiceUtils;

/**
 * @author Simon Toens
 */
public class WMPropertyPlaceholderConfigurer extends PropertyPlaceholderConfigurer {

    private static final String RANDOM_STRING = "{randomStr}";
    private static final String TMP_DIR = "{tmpDir}";

    @Override
    protected String convertPropertyValue(String value) {
        if (SystemUtils.isEncrypted(value)) {
            return SystemUtils.decrypt(value);
        }

        if (value.contains(DataServiceConstants.WEB_ROOT_TOKEN)) {
            if (WMAppContext.getInstance() != null) {
                String path = WMAppContext.getInstance().getAppContextRoot();
                if(!org.apache.commons.lang3.StringUtils.isBlank(path)) {
                    value = StringUtils.replacePlainStr(value, DataServiceConstants.WEB_ROOT_TOKEN, path);
                }
            }
        }

        if(value.contains(DataServiceConstants.WM_MY_SQL_CLOUD_HOST_TOKEN)) {
            value = DataServiceUtils.replaceMySqlCloudToken(value, DataServiceConstants.WM_MY_SQL_CLOUD_HOST);
        }

        if(value.contains(DataServiceConstants.WM_MY_SQL_CLOUD_USER_NAME_TOKEN)) {
            value = StringUtils.replacePlainStr(value, DataServiceConstants.WM_MY_SQL_CLOUD_USER_NAME_TOKEN,
                    DataServiceConstants.WM_MY_SQL_CLOUD_USER_NAME);
        }

        if(value.contains(DataServiceConstants.WM_MY_SQL_CLOUD_PASSWORD_TOKEN)) {
            value = StringUtils.replacePlainStr(value, DataServiceConstants.WM_MY_SQL_CLOUD_PASSWORD_TOKEN,
                    DataServiceConstants.WM_MY_SQL_CLOUD_PASSWORD);
        }

        if (value.contains(RANDOM_STRING)) {
            String randomStr = UUID.randomUUID().toString();
            value = StringUtils.replacePlainStr(value, RANDOM_STRING, randomStr);
        }
        if (value.contains(TMP_DIR)) {
            String tmpDir = System.getProperty("java.io.tmpdir");
            value = StringUtils.replacePlainStr(value, TMP_DIR, tmpDir);
        }
        return value;
    }
}
