package com.wavemaker.runtime.data.filter.parser.utils.dataprovider;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.sql.Date;
import java.sql.Time;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * @author Sujith Simon
 * Created on : 9/11/18
 */
public class FieldsMetadata {

    private static final Map<Class<?>, Object[]> sampleValuesMap = new LinkedHashMap<>();

    private static final List<Class<?>> fields = Arrays.asList(Byte.class, Short.class, Integer.class, Long.class,
            BigInteger.class, Float.class, Double.class, BigDecimal.class, Boolean.class, Character.class, String.class,
            Date.class, Time.class, LocalDateTime.class, Timestamp.class
    );


    static {
        sampleValuesMap.put(Byte.class,
                new Object[]{12, 34, 70, 122});

        sampleValuesMap.put(Short.class,
                new Object[]{1242, 232, 1, 2311});

        sampleValuesMap.put(Integer.class,
                new Object[]{11, 231231, 112411, 1222});

        sampleValuesMap.put(Long.class,
                new Object[]{12312311231L, 34543212133L, 7232134523L, 7643211232L});

        sampleValuesMap.put(BigInteger.class,
                new Object[]{1234123, 123412341234123L, 12342134, 123412342134L});

        sampleValuesMap.put(Float.class,
                new Object[]{23423.23, 23.2, 1234.2134, 1234.1234});

        sampleValuesMap.put(Double.class,
                new Object[]{1123, 123.21, 0.23, 112.2});

        sampleValuesMap.put(BigDecimal.class,
                new Object[]{123123123, 54634563, 344365356, 4456});

        sampleValuesMap.put(Boolean.class,
                new Object[]{true, false, "T", "Y"});

        sampleValuesMap.put(Character.class,
                new Object[]{"2", "e", "d", "f"});

        sampleValuesMap.put(String.class,
                new Object[]{"string", "string", "string", "string"});

        sampleValuesMap.put(Date.class,
                new Object[]{"2015-03-02", 12312312312L, "11231231287", "2011-08-01"});

        sampleValuesMap.put(Time.class,
                new Object[]{123123123, 1231235643, 343465533, 245734657});

        sampleValuesMap.put(LocalDateTime.class,
                new Object[]{"2016-11-05T15:10:37.995", "1992-05-22T22:11:17.012", "1892-10-18T22:11:59.332", "2015-01-26T00:00:00.000"});

        sampleValuesMap.put(Timestamp.class,
                new Object[]{7584324635243L, 7265117836L, 8346528726352L, 7263526352L});
    }

    public static Object[] getSampleValues(Class<?> dataType) {
        return sampleValuesMap.get(dataType);
    }

    public static List<Class<?>> getFields() {
        return fields;
    }


    public static List<Class<?>> getFieldsExcluding(Class<?>... excludeFields) {
        List<Class<?>> filteredFields = new ArrayList<>(fields);
        filteredFields.removeAll(Arrays.asList(excludeFields));
        return filteredFields;
    }


}
