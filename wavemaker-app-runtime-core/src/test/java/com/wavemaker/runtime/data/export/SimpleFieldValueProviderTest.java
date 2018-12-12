package com.wavemaker.runtime.data.export;

import org.junit.Assert;
import org.junit.Test;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 12/12/18
 */
public class SimpleFieldValueProviderTest {


    @Test
    public void testSimpleGetValue() {
        SimpleFieldValueProvider valueProvider = new SimpleFieldValueProvider("name", Employee.class);

        Employee testData = new Employee("testEmpName", new Department("testDeptName"));

        Assert.assertEquals("testEmpName", valueProvider.getValue(testData));
    }

    @Test
    public void testNestedGetValue() {
        SimpleFieldValueProvider valueProvider = new SimpleFieldValueProvider("department.name", Employee.class);

        Employee testData = new Employee("testEmpName", new Department("testDeptName"));

        Assert.assertEquals("testDeptName", valueProvider.getValue(testData));
    }

    private static class Employee {
        private final String name;
        private final Department department;

        private Employee(
                final String name,
                final Department department) {
            this.name = name;
            this.department = department;
        }

        public String getName() {
            return name;
        }

        public Department getDepartment() {
            return department;
        }
    }

    private static class Department {
        private final String name;

        private Department(final String name) {
            this.name = name;
        }

        public String getName() {
            return name;
        }
    }
}