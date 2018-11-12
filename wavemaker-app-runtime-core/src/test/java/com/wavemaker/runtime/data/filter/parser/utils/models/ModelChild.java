package com.wavemaker.runtime.data.filter.parser.utils.models;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.sql.Date;
import java.sql.Time;
import java.sql.Timestamp;
import java.time.LocalDateTime;

public class ModelChild {
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
    private ModelGrandChild grandChild;
}