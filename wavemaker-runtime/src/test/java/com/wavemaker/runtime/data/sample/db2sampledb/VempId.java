/**
 * Copyright (C) 2014 WaveMaker, Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.wavemaker.runtime.data.sample.db2sampledb;

// Generated Feb 7, 2008 1:47:51 PM by Hibernate Tools 3.2.0.CR1

/**
 * VempId generated by hbm2java
 */
@SuppressWarnings({ "serial" })
public class VempId implements java.io.Serializable {

    private String empno;

    private String firstnme;

    private Character midinit;

    private String lastname;

    private String workdept;

    public VempId() {
    }

    public VempId(String empno, String firstnme, String lastname) {
        this.empno = empno;
        this.firstnme = firstnme;
        this.lastname = lastname;
    }

    public VempId(String empno, String firstnme, Character midinit, String lastname, String workdept) {
        this.empno = empno;
        this.firstnme = firstnme;
        this.midinit = midinit;
        this.lastname = lastname;
        this.workdept = workdept;
    }

    public String getEmpno() {
        return this.empno;
    }

    public void setEmpno(String empno) {
        this.empno = empno;
    }

    public String getFirstnme() {
        return this.firstnme;
    }

    public void setFirstnme(String firstnme) {
        this.firstnme = firstnme;
    }

    public Character getMidinit() {
        return this.midinit;
    }

    public void setMidinit(Character midinit) {
        this.midinit = midinit;
    }

    public String getLastname() {
        return this.lastname;
    }

    public void setLastname(String lastname) {
        this.lastname = lastname;
    }

    public String getWorkdept() {
        return this.workdept;
    }

    public void setWorkdept(String workdept) {
        this.workdept = workdept;
    }

    @Override
    public boolean equals(Object other) {
        if (this == other) {
            return true;
        }
        if (other == null) {
            return false;
        }
        if (!(other instanceof VempId)) {
            return false;
        }
        VempId castOther = (VempId) other;

        return (this.getEmpno() == castOther.getEmpno() || this.getEmpno() != null && castOther.getEmpno() != null
            && this.getEmpno().equals(castOther.getEmpno()))
            && (this.getFirstnme() == castOther.getFirstnme() || this.getFirstnme() != null && castOther.getFirstnme() != null
                && this.getFirstnme().equals(castOther.getFirstnme()))
            && (this.getMidinit() == castOther.getMidinit() || this.getMidinit() != null && castOther.getMidinit() != null
                && this.getMidinit().equals(castOther.getMidinit()))
            && (this.getLastname() == castOther.getLastname() || this.getLastname() != null && castOther.getLastname() != null
                && this.getLastname().equals(castOther.getLastname()))
            && (this.getWorkdept() == castOther.getWorkdept() || this.getWorkdept() != null && castOther.getWorkdept() != null
                && this.getWorkdept().equals(castOther.getWorkdept()));
    }

    @Override
    public int hashCode() {
        int result = 17;

        result = 37 * result + (getEmpno() == null ? 0 : this.getEmpno().hashCode());
        result = 37 * result + (getFirstnme() == null ? 0 : this.getFirstnme().hashCode());
        result = 37 * result + (getMidinit() == null ? 0 : this.getMidinit().hashCode());
        result = 37 * result + (getLastname() == null ? 0 : this.getLastname().hashCode());
        result = 37 * result + (getWorkdept() == null ? 0 : this.getWorkdept().hashCode());
        return result;
    }

}
