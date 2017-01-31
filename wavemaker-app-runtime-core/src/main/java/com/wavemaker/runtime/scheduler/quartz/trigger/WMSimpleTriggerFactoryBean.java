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
package com.wavemaker.runtime.scheduler.quartz.trigger;

import java.sql.Timestamp;
import java.util.Date;

import org.quartz.impl.triggers.SimpleTriggerImpl;
import org.springframework.scheduling.quartz.SimpleTriggerFactoryBean;

/**
 * Created by saddhamp on 26/5/16.
 */
public class WMSimpleTriggerFactoryBean extends SimpleTriggerFactoryBean {
    private Date endTime;

    public void setStartTime(String startTimeStr){
        Timestamp startTime = Timestamp.valueOf(startTimeStr);
        super.setStartTime(startTime);
    }

    public void setEndTime(Date endTime) {
        this.endTime = endTime;
    }

    public void setEndTime(String endTimeStr) {
        this.endTime = Timestamp.valueOf(endTimeStr);
    }

    @Override
    public void afterPropertiesSet() {
        super.afterPropertiesSet();
        SimpleTriggerImpl cti = (SimpleTriggerImpl) getObject();
        cti.setEndTime(endTime);
    }
}
