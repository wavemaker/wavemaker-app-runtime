/*
 * Copyright (C) 2016 WaveMaker, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

package com.wavemaker.runtime.scheduler.quartz.trigger;

import java.util.Date;

import org.quartz.impl.triggers.CalendarIntervalTriggerImpl;

import com.wavemaker.commons.WMRuntimeException;

/**
 * Created by saddhamp on 27/6/16.
 */
public class WMCalendarIntervalTriggerImpl extends CalendarIntervalTriggerImpl {
    public static final int REPEAT_INDEFINITELY = -1;

    private int repeatCount = 0;

    /**
     * <p>
     * Set the the number of time the <code>CronTrigger</code> should
     * repeat, after which it will be automatically deleted.
     * </p>
     *
     * @see #REPEAT_INDEFINITELY
     * @exception WMRuntimeException
     *              if repeatCount is < 0
     */
    public void setRepeatCount(int repeatCount) {
        if (repeatCount < 0 && repeatCount != REPEAT_INDEFINITELY) {
            throw new WMRuntimeException(
                    "Repeat count must be >= 0, use the "
                            + "constant REPEAT_INDEFINITELY for infinite.");
        }

        this.repeatCount = repeatCount;
    }

    /**
     * <p>
     * Returns the next time at which the <code>DateIntervalTrigger</code> will
     * fire, after the given time. If the trigger will not fire after the given
     * time, <code>null</code> will be returned.
     * </p>
     */
    @Override
    public Date getFireTimeAfter(Date afterTime) {
        if ((getTimesTriggered() > repeatCount) && (repeatCount != REPEAT_INDEFINITELY)) {
            return null;
        }

        return super.getFireTimeAfter(afterTime);
    }

    /**
     * <p>
     * Returns the final time at which the <code>DateIntervalTrigger</code> will
     * fire, if there is no end time set, null will be returned.
     * </p>
     *
     * <p>
     * Note that the return time may be in the past.
     * </p>
     */
    @Override
    public Date getFinalFireTime() {
        if (repeatCount == 0) {
            return getStartTime();
        }

        return super.getFinalFireTime();
    }
}
