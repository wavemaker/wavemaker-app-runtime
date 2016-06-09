package com.wavemaker.runtime.scheduler;

import java.lang.reflect.InvocationTargetException;

import org.quartz.JobDetail;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.quartz.Scheduler;
import org.quartz.impl.JobDetailImpl;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.BeanNameAware;
import org.springframework.beans.factory.FactoryBean;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.beans.support.ArgumentConvertingMethodInvoker;
import org.springframework.scheduling.quartz.JobMethodInvocationFailedException;
import org.springframework.scheduling.quartz.QuartzJobBean;
import org.springframework.util.MethodInvoker;

/**
 * Created by saddhamp on 24/5/16.
 */
public class WMMethodInvokingJobDetailFactoryBean  extends ArgumentConvertingMethodInvoker
        implements FactoryBean<JobDetail>, BeanNameAware, InitializingBean {

    private String name;

    private String group = Scheduler.DEFAULT_GROUP;

    private JobDetail jobDetail;

    private String beanName;

    public void setName(String name) {
        this.name = name;
    }

    public void setGroup(String group) {
        this.group = group;
    }

    @Override
    public void setBeanName(String beanName) {
        this.beanName = beanName;
    }

    @Override
    public void afterPropertiesSet() throws ClassNotFoundException, NoSuchMethodException {
        prepare();

        // Use specific name if given, else fall back to bean name.
        String name = (this.name != null ? this.name : this.beanName);

        // Build JobDetail instance.
        JobDetailImpl jdi = new JobDetailImpl();
        jdi.setName(name);
        jdi.setGroup(this.group);
        jdi.setJobClass(WMMethodInvokingJob.class);
        jdi.getJobDataMap().put("methodInvoker", this);
        this.jobDetail = jdi;
    }

    @Override
    public JobDetail getObject() {
        return this.jobDetail;
    }

    @Override
    public Class<? extends JobDetail> getObjectType() {
        return (this.jobDetail != null ? this.jobDetail.getClass() : JobDetail.class);
    }

    @Override
    public boolean isSingleton() {
        return true;
    }

    /**
     * Quartz Job implementation that invokes a specified method.
     * Automatically applied by WMMethodInvokingJobDetailFactoryBean.
     */
    public static class WMMethodInvokingJob extends QuartzJobBean {
        private static final Logger logger = LoggerFactory.getLogger(WMMethodInvokingJob.class);

        private MethodInvoker methodInvoker;

        public void setMethodInvoker(MethodInvoker methodInvoker) {
            this.methodInvoker = methodInvoker;
        }

        @Override
        protected void executeInternal(JobExecutionContext context) throws JobExecutionException {
            try {
                long startTime = System.currentTimeMillis();
                context.setResult(methodInvoker.invoke());
                long endTime = System.currentTimeMillis();
                logger.info("Task {} took {} seconds to complete.", methodInvoker.getTargetMethod(), (endTime-startTime)/1000);
            } catch (InvocationTargetException ex) {
                if (ex.getTargetException() instanceof JobExecutionException) {
                    // -> JobExecutionException, to be logged at info level by Quartz
                    throw (JobExecutionException) ex.getTargetException();
                } else {
                    // -> "unhandled exception", to be logged at error level by Quartz
                    throw new JobMethodInvocationFailedException(methodInvoker, ex.getTargetException());
                }
            } catch (Exception ex) {
                // -> "unhandled exception", to be logged at error level by Quartz
                throw new JobMethodInvocationFailedException(methodInvoker, ex);
            }
        }
    }
}
