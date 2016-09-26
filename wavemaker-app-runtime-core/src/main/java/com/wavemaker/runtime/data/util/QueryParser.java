package com.wavemaker.runtime.data.util;

import java.util.Collection;
import java.util.LinkedList;
import java.util.List;
import java.util.Stack;

import org.hibernate.Criteria;
import org.hibernate.criterion.Criterion;
import org.hibernate.criterion.LogicalExpression;

import com.wavemaker.runtime.data.Types;
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
    private static String DOT = ".";

    public QueryParser() {
    }

    public Criterion parse(String query, Class<?> entityClass, Criteria criteria) {
        TypeInformation typeInformation = TypeMapBuilder.buildFieldNameVsTypeMap(entityClass, true);
        return parse(query, typeInformation, criteria);
    }

    public Criterion parse(String query, TypeInformation typeInformation, Criteria criteria) {
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
                    if (token.contains(DOT)) {
                        CriteriaUtils.criteriaForRelatedProperty(criteria, token, null);
                    }
                    if (type != null) {
                        Types types = typeInformation.getFieldVsTypeMap().get(token);
                        // token is variable name here
                        if (types == null) {
                            if (QueryParserConstants.ID.equals(token) && typeInformation.hasSimpleId()) {
                                //overriding field name to primary key, if no field exists with given name in entity class.
                                types = typeInformation.getFieldVsTypeMap().get(typeInformation.getFirstIdField());
                            } else {
                                throw new WMRuntimeException("Invalid field name [" + token + "] in the query");
                            }
                        }

                        if (Type.IN == type || Type.BETWEEN == type) {
                            Collection value = formatOperandAsCollection(stringTokenizer, types);
                            criterionStack.push(type.criterion(token, value));
                        } else {
                            String value = stringTokenizer.nextToken();
                            Object castedValue = types.toJavaType(removeQuotes(value));
                            criterionStack.push(type.criterion(token, castedValue));
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

    private Collection formatOperandAsCollection(RegExStringTokenizer stringTokenizer, Types types) {
        List<Object> tokens = new LinkedList<>();
        String token;
//        todo  skip expected token OPEN_PARENTHESIS properly
        stringTokenizer.nextToken();
        do {
            token = stringTokenizer.nextToken();
            if (!token.equals(CLOSE_PARENTHESIS) && !token.isEmpty() && !token.equals(COMMA)) {
                tokens.add(types.toJavaType(removeQuotes(token.replace(COMMA, ""))));
            }
        } while (!CLOSE_PARENTHESIS.equals(token));
        return tokens;
    }

    private String removeQuotes(String value) {
        if (value.startsWith(SINGLE_QUOTE) && value.endsWith(SINGLE_QUOTE)) {
            value = value.substring(1, value.length() - 1);
        }
        return value;
    }

    private boolean hasPrecedence(String op2) {
        return (!(op2.equals(OPEN_PARENTHESIS) || op2.equals(CLOSE_PARENTHESIS)));
    }

    private LogicalExpression applyOp(Criterion lhs, Criterion rhs, JoinType joinType) {
        return joinType.criterion(lhs, rhs);
    }

    private boolean isJoinOperator(String operator) {
        return JoinType.valueFor(operator) != null;
    }
}
