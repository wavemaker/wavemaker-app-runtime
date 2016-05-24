package com.wavemaker.runtime.data.util;

import java.lang.reflect.Constructor;
import java.util.Collection;
import java.util.LinkedList;
import java.util.List;
import java.util.Stack;

import org.hibernate.criterion.Criterion;
import org.hibernate.criterion.LogicalExpression;

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
                        Class operandTypeClass = entityClass.getDeclaredField(token).getType();
                        if (Type.IN == type) {
                            Collection value = formatOperandForIn(stringTokenizer, operandTypeClass);
                            criterionStack.push(type.criterion(token, value));
                        } else {
                            String value = stringTokenizer.nextToken();
                            if (value.startsWith(SINGLE_QUOTE) && value.endsWith(SINGLE_QUOTE)) {
                                value = value.substring(1, value.length() - 1);
                            }
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
        } catch (NoSuchFieldException e) {
            throw new WMRuntimeException("no such field found ", e);
        }
        return criterionStack.pop();
    }

    private Object castOperand(String value, Class<?> typeClass) {
        try {
            Constructor<?> cons = typeClass.getConstructor(new Class<?>[]{String.class});
            return cons.newInstance(value);
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

    private Collection formatOperandForIn(RegExStringTokenizer stringTokenizer, Class<?> typeClass) {
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
