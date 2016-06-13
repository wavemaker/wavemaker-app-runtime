package com.wavemaker.runtime.scheduler.quartz.trigger;

import java.sql.Timestamp;
import java.text.ParseException;
import java.util.Date;
import java.util.Map;
import java.util.TimeZone;

import org.quartz.CronTrigger;
import org.quartz.JobDataMap;
import org.quartz.JobDetail;
import org.quartz.Scheduler;
import org.springframework.beans.factory.BeanNameAware;
import org.springframework.beans.factory.FactoryBean;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.util.Assert;

/**
 * Created by saddhamp on 24/5/16.
 */
public class WMCronTriggerFactoryBean implements FactoryBean<CronTrigger>, BeanNameAware, InitializingBean {
    private String name;
    private String group;
    private JobDetail jobDetail;
    private JobDataMap jobDataMap = new JobDataMap();
    private Date startTime;
    private Date endTime;
    private long startDelay = 0;
    private String cronExpression;
    private TimeZone timeZone;
    private String calendarName;
    private int priority;
    private String description;
    private String beanName;
    private int repeatCount = WMCronTriggerImpl.REPEAT_INDEFINITELY;
    private CronTrigger cronTrigger;

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

    public void setJobDataAsMap(Map<String, ?> jobDataAsMap) {
        this.jobDataMap.putAll(jobDataAsMap);
    }

    public void setStartTime(Date startTime) {
        this.startTime = startTime;
    }

    public void setStartTime(String startTimeStr){
        this.startTime = Timestamp.valueOf(startTimeStr);
    }

    public void setEndTime(Date endTime) {
        this.endTime = endTime;
    }

    public void setEndTime(String endTimeStr) {
        this.endTime = Timestamp.valueOf(endTimeStr);
    }

    public void setStartDelay(long startDelay) {
        Assert.isTrue(startDelay >= 0, "Start delay cannot be negative");
        this.startDelay = startDelay;
    }

    public void setCronExpression(String cronExpression) {
        this.cronExpression = cronExpression;
    }

    public void setTimeZone(TimeZone timeZone) {
        this.timeZone = timeZone;
    }

    public void setCalendarName(String calendarName) {
        this.calendarName = calendarName;
    }

    public void setPriority(int priority) {
        this.priority = priority;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public void setBeanName(String beanName) {
        this.beanName = beanName;
    }

    public void setRepeatCount(int repeatCount) {
        this.repeatCount = repeatCount;
    }

    @Override
    public void afterPropertiesSet() throws ParseException {
        if (this.name == null) {
            this.name = this.beanName;
        }
        if (this.group == null) {
            this.group = Scheduler.DEFAULT_GROUP;
        }
        if (this.jobDetail != null) {
            this.jobDataMap.put("jobDetail", this.jobDetail);
        }
        if (this.startDelay > 0 || this.startTime == null) {
            this.startTime = new Date(System.currentTimeMillis() + this.startDelay);
        }
        if (this.timeZone == null) {
            this.timeZone = TimeZone.getDefault();
        }

        WMCronTriggerImpl wmCronTriggerImpl = new WMCronTriggerImpl();
        wmCronTriggerImpl.setName(this.name);
        wmCronTriggerImpl.setGroup(this.group);
        wmCronTriggerImpl.setJobKey(this.jobDetail.getKey());
        wmCronTriggerImpl.setJobDataMap(this.jobDataMap);
        wmCronTriggerImpl.setStartTime(this.startTime);
        wmCronTriggerImpl.setCronExpression(this.cronExpression);
        wmCronTriggerImpl.setTimeZone(this.timeZone);
        wmCronTriggerImpl.setCalendarName(this.calendarName);
        wmCronTriggerImpl.setPriority(this.priority);
        wmCronTriggerImpl.setDescription(this.description);
        wmCronTriggerImpl.setRepeatCount(repeatCount);
        wmCronTriggerImpl.setEndTime(endTime);
        this.cronTrigger = wmCronTriggerImpl;
    }

    @Override
    public CronTrigger getObject() {
        return this.cronTrigger;
    }

    @Override
    public Class<?> getObjectType() {
        return CronTrigger.class;
    }

    @Override
    public boolean isSingleton() {
        return true;
    }

}
