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
 * VprojactId generated by hbm2java
 */
@SuppressWarnings({ "serial" })
public class VprojactId implements java.io.Serializable {

    private String projno;

    private short actno;

    private BigDecimal acstaff;

    private Date acstdate;

    private Date acendate;

    public VprojactId() {
    }

    public VprojactId(String projno, short actno, Date acstdate) {
        this.projno = projno;
        this.actno = actno;
        this.acstdate = acstdate;
    }

    public VprojactId(String projno, short actno, BigDecimal acstaff, Date acstdate, Date acendate) {
        this.projno = projno;
        this.actno = actno;
        this.acstaff = acstaff;
        this.acstdate = acstdate;
        this.acendate = acendate;
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

    public BigDecimal getAcstaff() {
        return this.acstaff;
    }

    public void setAcstaff(BigDecimal acstaff) {
        this.acstaff = acstaff;
    }

    public Date getAcstdate() {
        return this.acstdate;
    }

    public void setAcstdate(Date acstdate) {
        this.acstdate = acstdate;
    }

    public Date getAcendate() {
        return this.acendate;
    }

    public void setAcendate(Date acendate) {
        this.acendate = acendate;
    }

    @Override
    public boolean equals(Object other) {
        if (this == other) {
            return true;
        }
        if (other == null) {
            return false;
        }
        if (!(other instanceof VprojactId)) {
            return false;
        }
        VprojactId castOther = (VprojactId) other;

        return (this.getProjno() == castOther.getProjno() || this.getProjno() != null && castOther.getProjno() != null
            && this.getProjno().equals(castOther.getProjno()))
            && this.getActno() == castOther.getActno()
            && (this.getAcstaff() == castOther.getAcstaff() || this.getAcstaff() != null && castOther.getAcstaff() != null
                && this.getAcstaff().equals(castOther.getAcstaff()))
            && (this.getAcstdate() == castOther.getAcstdate() || this.getAcstdate() != null && castOther.getAcstdate() != null
                && this.getAcstdate().equals(castOther.getAcstdate()))
            && (this.getAcendate() == castOther.getAcendate() || this.getAcendate() != null && castOther.getAcendate() != null
                && this.getAcendate().equals(castOther.getAcendate()));
    }

    @Override
    public int hashCode() {
        int result = 17;

        result = 37 * result + (getProjno() == null ? 0 : this.getProjno().hashCode());
        result = 37 * result + this.getActno();
        result = 37 * result + (getAcstaff() == null ? 0 : this.getAcstaff().hashCode());
        result = 37 * result + (getAcstdate() == null ? 0 : this.getAcstdate().hashCode());
        result = 37 * result + (getAcendate() == null ? 0 : this.getAcendate().hashCode());
        return result;
    }

}
