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

import java.math.BigDecimal;
import java.util.Date;

/**
 * VempprojactId generated by hbm2java
 */
@SuppressWarnings({ "serial" })
public class VempprojactId implements java.io.Serializable {

    private String empno;

    private String projno;

    private short actno;

    private BigDecimal emptime;

    private Date emstdate;

    private Date emendate;

    public VempprojactId() {
    }

    public VempprojactId(String empno, String projno, short actno) {
        this.empno = empno;
        this.projno = projno;
        this.actno = actno;
    }

    public VempprojactId(String empno, String projno, short actno, BigDecimal emptime, Date emstdate, Date emendate) {
        this.empno = empno;
        this.projno = projno;
        this.actno = actno;
        this.emptime = emptime;
        this.emstdate = emstdate;
        this.emendate = emendate;
    }

    public String getEmpno() {
        return this.empno;
    }

    public void setEmpno(String empno) {
        this.empno = empno;
    }

    public String getProjno() {
        return this.projno;
    }

    public void setProjno(String projno) {
        this.projno = projno;
    }

    public short getActno() {
        return this.actno;
    }

    public void setActno(short actno) {
        this.actno = actno;
    }

    public BigDecimal getEmptime() {
        return this.emptime;
    }

    public void setEmptime(BigDecimal emptime) {
        this.emptime = emptime;
    }

    public Date getEmstdate() {
        return this.emstdate;
    }

    public void setEmstdate(Date emstdate) {
        this.emstdate = emstdate;
    }

    public Date getEmendate() {
        return this.emendate;
    }

    public void setEmendate(Date emendate) {
        this.emendate = emendate;
    }

    @Override
    public boolean equals(Object other) {
        if (this == other) {
            return true;
        }
        if (other == null) {
            return false;
        }
        if (!(other instanceof VempprojactId)) {
            return false;
        }
        VempprojactId castOther = (VempprojactId) other;

        return (this.getEmpno() == castOther.getEmpno() || this.getEmpno() != null && castOther.getEmpno() != null
            && this.getEmpno().equals(castOther.getEmpno()))
            && (this.getProjno() == castOther.getProjno() || this.getProjno() != null && castOther.getProjno() != null
                && this.getProjno().equals(castOther.getProjno()))
            && this.getActno() == castOther.getActno()
            && (this.getEmptime() == castOther.getEmptime() || this.getEmptime() != null && castOther.getEmptime() != null
                && this.getEmptime().equals(castOther.getEmptime()))
            && (this.getEmstdate() == castOther.getEmstdate() || this.getEmstdate() != null && castOther.getEmstdate() != null
                && this.getEmstdate().equals(castOther.getEmstdate()))
            && (this.getEmendate() == castOther.getEmendate() || this.getEmendate() != null && castOther.getEmendate() != null
                && this.getEmendate().equals(castOther.getEmendate()));
    }

    @Override
    public int hashCode() {
        int result = 17;

        result = 37 * result + (getEmpno() == null ? 0 : this.getEmpno().hashCode());
        result = 37 * result + (getProjno() == null ? 0 : this.getProjno().hashCode());
        result = 37 * result + this.getActno();
        result = 37 * result + (getEmptime() == null ? 0 : this.getEmptime().hashCode());
        result = 37 * result + (getEmstdate() == null ? 0 : this.getEmstdate().hashCode());
        result = 37 * result + (getEmendate() == null ? 0 : this.getEmendate().hashCode());
        return result;
    }

}
