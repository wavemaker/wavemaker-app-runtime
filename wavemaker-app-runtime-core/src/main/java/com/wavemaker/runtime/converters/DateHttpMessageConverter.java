package com.wavemaker.runtime.converters;

import java.io.IOException;
import java.util.Date;

import org.springframework.http.HttpInputMessage;
import org.springframework.http.HttpOutputMessage;
import org.springframework.http.MediaType;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.http.converter.HttpMessageNotWritableException;

import com.wavemaker.commons.json.deserializer.WMDateDeSerializer;
import com.wavemaker.commons.util.IOUtils;

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
    protected Date readInternal(Class<? extends Date> clazz, HttpInputMessage inputMessage) throws IOException, HttpMessageNotReadableException {
        String date = IOUtils.toString(inputMessage.getBody());
        Date dateObj = WMDateDeSerializer.getDate(date);
        return dateObj;
    }

    @Override
    protected void writeInternal(Date date, HttpOutputMessage outputMessage) throws IOException, HttpMessageNotWritableException {
        outputMessage.getBody().write(date.toString().getBytes());
    }

}
