package com.wavemaker.runtime.spring.converters;

import java.util.Date;

import org.springframework.core.convert.converter.Converter;
import org.springframework.format.FormatterRegistry;
import org.springframework.format.support.FormattingConversionServiceFactoryBean;

import com.wavemaker.studio.common.ser.WMDateDeSerializer;
import com.wavemaker.studio.common.ser.WMSqlDateDeSerializer;
import com.wavemaker.studio.common.util.StringUtils;

/**
 * @Author: sowmyad
 */
public class ApplicationConversionServiceFactoryBean extends FormattingConversionServiceFactoryBean {

    @Override
    protected void installFormatters(FormatterRegistry registry) {
        super.installFormatters(registry);
        registry.addConverter(new WMStringToDateConverter());
        registry.addConverter(new WMStringToSqlDateConverter());
    }

    static class WMStringToDateConverter implements Converter<String, Date> {

        @Override
        public Date convert(String source) {
            if(StringUtils.isNumber(source)){
                return new Date(Long.parseLong(source));
            } else{
                return WMDateDeSerializer.getDate(source);
            }
        }
    }

    static class WMStringToSqlDateConverter implements Converter<String, java.sql.Date> {

        @Override
        public java.sql.Date convert(String source) {
            if(StringUtils.isNumber(source)){
                return new java.sql.Date(Long.parseLong(source));
            } else{
                return WMSqlDateDeSerializer.getDate(source);
            }
        }
    }
}