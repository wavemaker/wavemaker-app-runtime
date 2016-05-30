package com.wavemaker.runtime.data.util;

import java.lang.reflect.Constructor;
import java.text.SimpleDateFormat;
import java.util.Collection;
import java.util.Date;
import java.util.LinkedList;
import java.util.List;
import java.util.Stack;

import org.hibernate.criterion.Criterion;
import org.hibernate.criterion.LogicalExpression;
import org.joda.time.LocalDateTime;

import com.wavemaker.runtime.data.JasperType;
import com.wavemaker.runtime.data.expression.JoinType;
import com.wavemaker.runtime.data.expression.Type;
import com.wavemaker.studio.common.WMRuntimeException;

/**
 * @author <a href="mailto:anusha.dharmasagar@wavemaker.com">Anusha Dharmasagar</a>
 * @since 20/5/16
 */
public class QueryParser {


    private static String QUERY_DELIMITER = "[^\\s\"']+|\"([^\"]*)\"|'([^']*)'";
    private static String OPEN_PARENTHESIS = "(";
    private static String CLOSE_PARENTHESIS = ")";
    private static String SINGLE_QUOTE = "'";
    private static String COMMA = ",";

    private Class entityClass;

    public QueryParser(Class entityClass) {
        this.entityClass = entityClass;
    }

    public Criterion parse(String query) {

        Stack<Criterion> criterionStack = new Stack<>();
        Stack<String> joinOperatorStack = new Stack<>();
        RegExStringTokenizer stringTokenizer = new RegExStringTokenizer(query, QUERY_DELIMITER);


        try {
            while (stringTokenizer.hasNext()) {
                String token = stringTokenizer.nextToken();
                if (token.equals(OPEN_PARENTHESIS)) {
                    joinOperatorStack.push(token);
                } else if (token.equals(CLOSE_PARENTHESIS)) {
                    while (!joinOperatorStack.peek().equals(OPEN_PARENTHESIS)) {
                        if (JoinType.valueFor(joinOperatorStack.peek()) != null) {
                            JoinType joinType = JoinType.valueFor(joinOperatorStack.pop());
                            criterionStack.push(applyOp(criterionStack.pop(), criterionStack.pop(), joinType));
                        }
                    }
                    joinOperatorStack.pop();
                } else if (isJoinOperator(token)) {
                    while (!joinOperatorStack.isEmpty() && hasPrecedence(joinOperatorStack.peek())) {
                        JoinType joinType = JoinType.valueFor(joinOperatorStack.pop());
                        criterionStack.push(applyOp(criterionStack.pop(), criterionStack.pop(), joinType));
                    }
                    joinOperatorStack.push(token);
                } else {
                    String operator = stringTokenizer.nextToken();
                    Type type = Type.valueFor(operator);
                    if (type != null) {
                        String[] classNameFieldName = token.split("\\.");
                        Class operandTypeClass;
                        if (classNameFieldName.length > 2) {
                            ReportContext reportContext = new ReportContext();
                            JasperType jasperType = reportContext.buildFieldNameVsTypeMap(classNameFieldName[0]).get(classNameFieldName[2]);
                            operandTypeClass = jasperType.getJavaClass();

                        } else {
                            operandTypeClass = entityClass.getDeclaredField(token).getType();
                        }
                        if (Type.IN == type || Type.BETWEEN == type) {
                            Collection value = formatOperandAsCollection(stringTokenizer, operandTypeClass);
                            criterionStack.push(type.criterion(token, value));
                        } else {
                            String value = stringTokenizer.nextToken();
                            criterionStack.push(type.criterion(token, castOperand(value, operandTypeClass)));
                        }
                    } else {
                        throw new WMRuntimeException("Invalid operator in the query");
                    }
                }
            }
            while (!joinOperatorStack.empty()) {
                JoinType joinType = JoinType.valueFor(joinOperatorStack.pop());
                criterionStack.push(applyOp(criterionStack.pop(), criterionStack.pop(), joinType));
            }
        } catch (Exception e) {
            throw new WMRuntimeException("error while parsing the condition query", e);
        }
        return criterionStack.pop();
    }

    private Object castOperand(String value, Class<?> typeClass) {
        try {
            if (value.startsWith(SINGLE_QUOTE) && value.endsWith(SINGLE_QUOTE)) {
                value = value.substring(1, value.length() - 1);
            }
            Object castedValue;
            if (typeClass == Date.class) {
                SimpleDateFormat formatter = new SimpleDateFormat("yyyy-MM-dd");
                castedValue = formatter.parse(value);
            } else if (typeClass == LocalDateTime.class) {
                castedValue = LocalDateTime.parse(value);
            } else {
                Constructor<?> cons = typeClass.getConstructor(new Class<?>[]{String.class});
                castedValue = cons.newInstance(value);
            }
            return castedValue;
        } catch (Exception e) {
            throw new WMRuntimeException("Exception while casting the operand", e);
        }

    }

    private boolean hasPrecedence(String op2) {
        return (!(op2.equals(OPEN_PARENTHESIS) || op2.equals(CLOSE_PARENTHESIS)));
    }

    private LogicalExpression applyOp(Criterion lhs, Criterion rhs, JoinType joinType) {
        return joinType.criterion(lhs, rhs);
    }

    private Collection formatOperandAsCollection(RegExStringTokenizer stringTokenizer, Class<?> typeClass) {
        List<Object> tokens = new LinkedList<>();
        String token;
//        todo  skip expected token OPEN_PARENTHESIS properly
        stringTokenizer.nextToken();
        do {
            token = stringTokenizer.nextToken();
            if (!token.equals(CLOSE_PARENTHESIS) && !token.isEmpty() && !token.equals(COMMA)) {
                tokens.add(castOperand(token.replace(COMMA, ""), typeClass));
            }
        } while (!CLOSE_PARENTHESIS.equals(token));
        return tokens;
    }

    private boolean isJoinOperator(String operator) {
        return JoinType.valueFor(operator) != null;
    }
}
