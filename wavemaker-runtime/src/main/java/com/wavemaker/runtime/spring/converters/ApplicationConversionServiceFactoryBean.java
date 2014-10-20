package com.wavemaker.runtime.spring.converters;

import com.wavemaker.common.util.StringUtils;
import org.springframework.core.convert.converter.Converter;
import org.springframework.format.FormatterRegistry;
import org.springframework.format.support.FormattingConversionServiceFactoryBean;

import java.util.Date;

/**
 * @Author: sowmyad
 */
public class ApplicationConversionServiceFactoryBean extends FormattingConversionServiceFactoryBean {

    @Override
    protected void installFormatters(FormatterRegistry registry) {
        super.installFormatters(registry);
        registry.addConverter(getStringToDateConverter());
        registry.addConverter(getStringToSqlDateConverter());
    }

    public Converter<String, Date> getStringToDateConverter() {
        return new Converter<String, Date>() {

            @Override
            public Date convert(String source) {
                Date dt = null;
                if(StringUtils.isNumber(source)){
                   dt= new Date(new Long(source));
                } else{
                    dt = new Date(source);
                }
                return dt;

            }

        };
    }


    public Converter<String, java.sql.Date> getStringToSqlDateConverter() {
        return new Converter<String, java.sql.Date>() {

            @Override
            public java.sql.Date convert(String source) {
                java.sql.Date dt = null;
                if(StringUtils.isNumber(source)){
                    dt= new java.sql.Date(new Long(source));
                } else{
                    Date utilDate = new Date(new Long(source));
                    dt = new java.sql.Date(utilDate.getTime());
                }
                return  dt;

            }

        };
    }
}