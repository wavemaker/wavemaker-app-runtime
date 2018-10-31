package com.wavemaker.runtime.data.filter.parser;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.sql.Blob;
import java.sql.Date;
import java.sql.Time;
import java.sql.Timestamp;
import java.time.LocalDateTime;

/**
 * @author Sujith Simon
 * Created on : 2/11/18
 */
public class Model {


    public class Level1 {
        private Byte wmByte;
        private Short wmShort;
        private Integer wmInteger;
        private Long wmLong;
        private BigInteger wmBigInteger;
        private Float wmFloat;
        private Double wmDouble;
        private BigDecimal wmBigDecimal;
        private Boolean wmBoolean;
        private Character wmCharacter;
        private String wmString;
        private Date wmDate;
        private Time wmTime;
        private LocalDateTime wmLocalDateTime;
        private Timestamp wmTimestamp;
        private Blob wmBlob;
        private Level2 level2;
    }

    public class Level2 {
        private Byte wmByte;
        private Short wmShort;
        private Integer wmInteger;
        private Long wmLong;
        private BigInteger wmBigInteger;
        private Float wmFloat;
        private Double wmDouble;
        private BigDecimal wmBigDecimal;
        private Boolean wmBoolean;
        private Character wmCharacter;
        private String wmString;
        private Date wmDate;
        private Time wmTime;
        private LocalDateTime wmLocalDateTime;
        private Timestamp wmTimestamp;
        private Blob wmBlob;
        private Level3 level3;
    }

    public class Level3 {
        private Byte wmByte;
        private Short wmShort;
        private Integer wmInteger;
        private Long wmLong;
        private BigInteger wmBigInteger;
        private Float wmFloat;
        private Double wmDouble;
        private BigDecimal wmBigDecimal;
        private Boolean wmBoolean;
        private Character wmCharacter;
        private String wmString;
        private Date wmDate;
        private Time wmTime;
        private LocalDateTime wmLocalDateTime;
        private Timestamp wmTimestamp;
        private Blob wmBlob;
    }

}
