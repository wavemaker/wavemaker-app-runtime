package com.wavemaker.runtime;

import java.io.IOException;
import java.sql.Time;
import java.sql.Timestamp;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.JsonToken;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.deser.std.DateDeserializers;

/**
 *
 * can deserialize date objects represented in one of the three formats "yyyy-MM-dd HH:mm:ss", "HH:mm:ss", ""yyyy-MM-dd".
 * @author Uday Shankar
 */
public class WMDateDeSerializer extends DateDeserializers.DateDeserializer {

    private static final String DEFAULT_DATE_FORMAT = "yyyy-MM-dd";
    private static final String DEFAULT_TIME_FORMAT = "HH:mm:ss";
    private static final String DEFAULT_DATE_TIME_FORMAT = "yyyy-MM-dd HH:mm:ss";

    private static final Logger logger = LoggerFactory.getLogger(WMDateDeSerializer.class);

    @Override
    public Date deserialize(JsonParser jsonParser, DeserializationContext deserializationContext) throws IOException, JsonProcessingException {
        JsonToken currentToken = jsonParser.getCurrentToken();
        if (currentToken == JsonToken.VALUE_STRING) {
            String value = jsonParser.getText();
            try {
                Date parsedDate = new SimpleDateFormat(DEFAULT_DATE_TIME_FORMAT).parse(value);
                return new Timestamp(parsedDate.getTime());
            } catch (ParseException e) {
                logger.trace("{} is not in the expected date time format {}", value, DEFAULT_DATE_TIME_FORMAT);
            }
            try {
                Date parsedDate = new SimpleDateFormat(DEFAULT_DATE_FORMAT).parse(value);
                return new java.sql.Date(parsedDate.getTime());
            } catch (ParseException e) {
                logger.trace("{} is not in the expected date format {}", value, DEFAULT_DATE_FORMAT);
            }
            try {
                Date parsedDate = new SimpleDateFormat(DEFAULT_TIME_FORMAT).parse(value);
                return new Time(parsedDate.getTime());
            } catch (ParseException e) {
                logger.trace("{} is not in the expected time format {}", value, DEFAULT_TIME_FORMAT);
            }
        }
        return super.deserialize(jsonParser, deserializationContext);
    }
}
