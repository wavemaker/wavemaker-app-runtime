package com.wavemaker.runtime.converters;

import java.io.IOException;
import java.util.Date;

import org.springframework.http.HttpInputMessage;
import org.springframework.http.HttpOutputMessage;
import org.springframework.http.MediaType;

import com.wavemaker.commons.json.deserializer.WMDateDeSerializer;
import com.wavemaker.commons.json.deserializer.WMSqlDateDeSerializer;
import com.wavemaker.commons.util.WMIOUtils;

/**
 * Created by srujant on 16/5/17.
 */
public class DateHttpMessageConverter extends WMCustomAbstractHttpMessageConverter<Date> {

    public DateHttpMessageConverter() {
        super(MediaType.ALL);
    }

    @Override
    protected boolean supports(Class<?> clazz) {
        return Date.class.isAssignableFrom(clazz);
    }

    @Override
    protected Date readInternal(Class<? extends Date> clazz, HttpInputMessage inputMessage) throws IOException {
        String date = WMIOUtils.toString(inputMessage.getBody());
        Date dateObj;
        if (clazz.equals(java.sql.Date.class)) {
            dateObj = WMSqlDateDeSerializer.getDate(date);
        } else {
            dateObj = WMDateDeSerializer.getDate(date);
        }
        return dateObj;
    }

    @Override
    protected void writeInternal(Date date, HttpOutputMessage outputMessage) throws IOException {
        outputMessage.getBody().write(date.toString().getBytes());
    }

}
