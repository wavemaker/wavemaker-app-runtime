package com.wavemaker.runtime;

import java.sql.Date;
import java.sql.Time;
import java.sql.Timestamp;
import java.util.Arrays;

import org.json.JSONException;
import org.junit.Test;
import org.skyscreamer.jsonassert.JSONAssert;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

import com.fasterxml.jackson.core.JsonProcessingException;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 15/10/18
 */
public class WMObjectMapperTest {

    @Test
    public void pageSerializationTest() throws JsonProcessingException, JSONException {
        WMObjectMapper objectMapper = new WMObjectMapper();
        Page<User> users = new PageImpl<>(Arrays.asList(new User("user1"), new User("user2")), PageRequest.of(0, 2),
                100);

        final String actual = objectMapper.writeValueAsString(users);
        String expected = "{\"content\":[{\"name\":\"user1\"},{\"name\":\"user2\"}],\"last\":false," +
                "\"totalElements\":100,\"totalPages\":50,\"sort\":[],\"first\":true,\"numberOfElements\":2,\"size\":2,\"number\":0}\n";
        JSONAssert.assertEquals(expected, actual, true);
    }

    @Test
    public void pageSerializationTest2() throws JsonProcessingException, JSONException {
        WMObjectMapper objectMapper = new WMObjectMapper();
        Page<User> users = new PageImpl<>(Arrays.asList(new User("user1"), new User("user2")), PageRequest.of(0, 2,
                Sort.by(new Sort.Order(Sort.Direction.DESC, "name"))),
                100);

        final String actual = objectMapper.writeValueAsString(users);
        String expected = "{\"content\":[{\"name\":\"user1\"},{\"name\":\"user2\"}],\"totalElements\":100," +
                "\"totalPages\":50,\"last\":false,\"sort\":[{\"direction\":\"DESC\",\"property\":\"name\",\"ignoreCase\":false,\"nullHandling\":\"NATIVE\",\"ascending\":false}],\"first\":true,\"numberOfElements\":2,\"size\":2,\"number\":0}";

        JSONAssert.assertEquals(expected, actual, true);
    }

    @Test
    public void testDate() throws JsonProcessingException, JSONException {
        DateTypes types = new DateTypes();

        WMObjectMapper objectMapper = new WMObjectMapper();

        final String actual = objectMapper.writeValueAsString(types);
        String expected = "{\"date\":\"2019-01-01\",\"time\":\"12:00:00\",\"timestamp\":1546324200000}";

        JSONAssert.assertEquals(expected, actual, true);
    }

    public static class DateTypes {
        private final Date date = Date.valueOf("2019-01-01");
        private final Time time = Time.valueOf("12:00:00");
        private final Timestamp timestamp = Timestamp.valueOf("2019-01-01 12:00:00");

        public Date getDate() {
            return date;
        }

        public Time getTime() {
            return time;
        }

        public Timestamp getTimestamp() {
            return timestamp;
        }
    }

    private static class User {
        private String name;

        public User() {
        }

        public User(final String name) {
            this.name = name;
        }

        public String getName() {
            return name;
        }

        public User setName(final String name) {
            this.name = name;
            return this;
        }
    }
}