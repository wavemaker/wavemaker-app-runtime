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
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.TimeZone;

import org.quartz.CalendarIntervalTrigger;
import org.quartz.DateBuilder;
import org.quartz.JobDataMap;
import org.quartz.JobDetail;
import org.quartz.Scheduler;
import org.springframework.beans.factory.BeanNameAware;
import org.springframework.beans.factory.FactoryBean;
import org.springframework.beans.factory.InitializingBean;

/**
 * Created by saddhamp on 27/6/16.
 */
public class WMCalendarIntervalTriggerFactoryBean implements FactoryBean<CalendarIntervalTrigger>, BeanNameAware, InitializingBean {
    private static String DEFAULT_TIMESTAMP_FORMAT = "yyyy-MM-dd HH:mm:ss.SSS";
    private String name;
    private String group;
    private JobDetail jobDetail;
    private JobDataMap jobDataMap = new JobDataMap();
    private String description;
    private int priority;
    private String startTime;
    private String endTime;
    private int repeatCount = WMCalendarIntervalTriggerImpl.REPEAT_INDEFINITELY;
    private int repeatInterval = 0;
    private DateBuilder.IntervalUnit repeatIntervalUnit = DateBuilder.IntervalUnit.DAY;
    private TimeZone timeZone;
    private String calendarName;
    private String beanName;
    private int misfireInstruction = CalendarIntervalTrigger.MISFIRE_INSTRUCTION_DO_NOTHING;
    private CalendarIntervalTrigger calendarIntervalTrigger;

    public void setName(String name) {
        this.name = name;
    }

    public void setGroup(String group) {
        this.group = group;
    }

    public void setJobDetail(JobDetail jobDetail) {
        this.jobDetail = jobDetail;
    }

    public void setJobDataMap(JobDataMap jobDataMap) {
        this.jobDataMap = jobDataMap;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public void setPriority(int priority) {
        this.priority = priority;
    }

    public void setStartTime(String startTime) {
        this.startTime = startTime;
    }

    public void setEndTime(String endTime) {
        this.endTime = endTime;
    }

    public void setRepeatCount(int repeatCount) {
        this.repeatCount = repeatCount;
    }

    public void setRepeatInterval(int repeatInterval) {
        this.repeatInterval = repeatInterval;
    }

    public void setRepeatIntervalUnit(DateBuilder.IntervalUnit repeatIntervalUnit) {
        this.repeatIntervalUnit = repeatIntervalUnit;
    }

    public void setRepeatIntervalUnit(String intervalUnit){
        this.repeatIntervalUnit = DateBuilder.IntervalUnit.valueOf(intervalUnit);
    }

    public void setTimeZone(String timeZoneId) {
        this.timeZone = TimeZone.getTimeZone(timeZoneId);
    }

    public void setCalendarName(String calendarName) {
        this.calendarName = calendarName;
    }

    @Override
    public void setBeanName(String beanName) {
        this.beanName = beanName;
    }

    public void setMisfireInstruction(int misfireInstruction) {
        this.misfireInstruction = misfireInstruction;
    }

    @Override
    public void afterPropertiesSet() throws Exception {
        if (name == null) {
            name = this.beanName;
        }
        if (group == null) {
            group = Scheduler.DEFAULT_GROUP;
        }
        if (jobDetail != null) {
            jobDataMap.put("jobDetail", this.jobDetail);
        }
        if (timeZone == null) {
            timeZone = TimeZone.getDefault();
        }

        Timestamp startTimestamp = Timestamp.valueOf(LocalDateTime.parse(startTime).format(DateTimeFormatter.ofPattern(DEFAULT_TIMESTAMP_FORMAT)));

        Timestamp endTimestamp = null;
        if(endTime != null){
            endTimestamp = Timestamp.valueOf(LocalDateTime.parse(endTime).format(DateTimeFormatter.ofPattern(DEFAULT_TIMESTAMP_FORMAT)));
        }

        WMCalendarIntervalTriggerImpl calendarIntervalTriggerImpl = new WMCalendarIntervalTriggerImpl();
        calendarIntervalTriggerImpl.setName(name);
        calendarIntervalTriggerImpl.setGroup(group);
        calendarIntervalTriggerImpl.setJobKey(jobDetail.getKey());
        calendarIntervalTriggerImpl.setJobDataMap(jobDataMap);
        calendarIntervalTriggerImpl.setStartTime(startTimestamp);
        calendarIntervalTriggerImpl.setRepeatCount(repeatCount);
        calendarIntervalTriggerImpl.setRepeatInterval(repeatInterval);
        calendarIntervalTriggerImpl.setRepeatIntervalUnit(repeatIntervalUnit);
        calendarIntervalTriggerImpl.setTimeZone(timeZone);
        calendarIntervalTriggerImpl.setMisfireInstruction(misfireInstruction);
        calendarIntervalTriggerImpl.setCalendarName(calendarName);
        calendarIntervalTriggerImpl.setPriority(priority);
        calendarIntervalTriggerImpl.setDescription(description);
        calendarIntervalTriggerImpl.setEndTime(endTimestamp);
        calendarIntervalTrigger = calendarIntervalTriggerImpl;
    }

    @Override
    public CalendarIntervalTrigger getObject() throws Exception {
        return calendarIntervalTrigger;
    }

    @Override
    public Class<?> getObjectType() {
        return CalendarIntervalTrigger.class;
    }

    @Override
    public boolean isSingleton() {
        return true;
    }
}
