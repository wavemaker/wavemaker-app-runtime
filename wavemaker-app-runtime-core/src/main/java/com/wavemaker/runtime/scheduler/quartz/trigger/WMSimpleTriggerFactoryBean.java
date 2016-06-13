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
