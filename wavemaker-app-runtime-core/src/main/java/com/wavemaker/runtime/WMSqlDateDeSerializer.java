package com.wavemaker.runtime;

import java.io.IOException;
import java.sql.Date;
import java.text.ParseException;
import java.text.SimpleDateFormat;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.JsonToken;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.wavemaker.studio.common.WMRuntimeException;

/**
 *
 * can deserialize java.sql.date objects represented in the format "yyyy-MM-dd".
 * @author Uday Shankar
 */
public class WMSqlDateDeSerializer extends JsonDeserializer<Date> {

    private static final String DEFAULT_DATE_FORMAT = "yyyy-MM-dd";

    @Override
    public Date deserialize(JsonParser jsonParser, DeserializationContext deserializationContext) throws IOException, JsonProcessingException {
        JsonToken currentToken = jsonParser.getCurrentToken();
        if (currentToken == JsonToken.VALUE_STRING) {
            String value = jsonParser.getText();
            return getDate(value);
        }
        throw new WMRuntimeException("Unable to read the token as java.sql.Date");
    }

    public static Date getDate(String value) {
        try {
            java.util.Date parsedDate = new SimpleDateFormat(DEFAULT_DATE_FORMAT).parse(value);
            return new Date(parsedDate.getTime());
        } catch (ParseException e) {
            throw new WMRuntimeException("Failed to parse the string " + value + "as java.sql.Date", e);
        }
    }
}
