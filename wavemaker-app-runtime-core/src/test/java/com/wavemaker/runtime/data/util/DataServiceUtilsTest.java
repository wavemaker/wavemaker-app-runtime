package com.wavemaker.runtime.data.util;

import static org.testng.Assert.*;

import com.wavemaker.runtime.data.exception.DataServiceRuntimeException;
import org.springframework.dao.InvalidDataAccessResourceUsageException;
import org.testng.annotations.Test;

import javax.validation.constraints.Null;
import java.io.FileNotFoundException;
import java.nio.file.FileSystemNotFoundException;

/**
 * Created by anitha on 2/11/15.
 */
public class DataServiceUtilsTest {

    @Test
    public void umwrapTest() {
        Exception e = new DataServiceRuntimeException("test message");
        RuntimeException e1 = new RuntimeException("abcd",e);
        RuntimeException runtimeException= new RuntimeException("some cause");
        RuntimeException e2 = new RuntimeException("efgh", e1);
        Exception e3 = new NullPointerException("Null Values") ;
        InvalidDataAccessResourceUsageException invalid= new InvalidDataAccessResourceUsageException("Invalid data");
        RuntimeException rx= new IndexOutOfBoundsException("Check Array");
        assertEquals(DataServiceUtils.unwrap(e),e);
        assertEquals(DataServiceUtils.unwrap(e2),e);
        assertEquals(DataServiceUtils.unwrap(rx),rx);
        assertEquals(DataServiceUtils.unwrap(invalid),invalid);
        assertEquals(DataServiceUtils.unwrap(e1),e);
        assertEquals(DataServiceUtils.unwrap(runtimeException),runtimeException);
        assertEquals(DataServiceUtils.unwrap(e3),e3);

    }

    @Test
    public void isDMLTest() {
        String query1 = "insert into detail values(1,'user','pwd')";
        String query2 = " update detail set password = 'abc123' where user= 'abc'";
        String query3 = "select * from detail";
        String query4 = "DELETE from detail where id=4";
        String query5 = "alter table detail add employeeid int";
        assertTrue(DataServiceUtils.isDML(query1));
        assertTrue(DataServiceUtils.isDML(query2));
        assertFalse(DataServiceUtils.isDML(query3));
        assertTrue(DataServiceUtils.isDML(query4));
        assertTrue(DataServiceUtils.isDML(query5));


    }
}
