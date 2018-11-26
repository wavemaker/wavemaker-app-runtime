package com.wavemaker.runtime.data.filter.parser;

import org.antlr.v4.runtime.ANTLRInputStream;
import org.antlr.v4.runtime.CommonTokenStream;
import org.antlr.v4.runtime.tree.ParseTree;
import org.antlr.v4.runtime.tree.TerminalNodeImpl;

import com.wavemaker.runtime.data.filter.WMQueryInfo;
import com.wavemaker.runtime.data.filter.parser.antlr4.HqlFilterLexer;
import com.wavemaker.runtime.data.filter.parser.antlr4.HqlFilterParser;


/**
 * @author Sujith Simon
 * Created on : 26/10/18
 */
public class HqlParser {

    private static HqlParser instance;

    public static HqlParser getInstance() {
        return instance == null ? instance = new HqlParser() : instance;
    }

    public WMQueryInfo parse(String expression, HqlFilterPropertyResolver resolver) {
        HqlParserContext hqlParserContext = new HqlParserContext(resolver);
        ParseTree rootNode = getRootNode(expression);
        parse(rootNode, hqlParserContext);
        return hqlParserContext.toWMQueryInfo();
    }

    private ParseTree getRootNode(String expression) {
        ANTLRInputStream in = new ANTLRInputStream(expression);
        HqlFilterLexer lexer = new HqlFilterLexer(in);
        lexer.removeErrorListeners();
        lexer.addErrorListener(new WMHqlAntlrErrorListner());

        CommonTokenStream tokens = new CommonTokenStream(lexer);

        HqlFilterParser parser = new HqlFilterParser(tokens);
        parser.removeErrorListeners();
        parser.addErrorListener(new WMHqlAntlrErrorListner());

        HqlFilterParser.WhereClauseContext query = parser.whereClause();
        return query.logicalExpression();
    }

    private void parse(ParseTree rule, HqlParserContext hqlParserContext) {
        for (int i = 0; i < rule.getChildCount(); i++) {
            ParseTree child = rule.getChild(i);
            if (child instanceof HqlFilterParser.ExpressionContext) {
                HqlFilterParser.ExpressionContext expression = (HqlFilterParser.ExpressionContext) child;
                HqlExpressionParser expressionResolver = new HqlExpressionParser(expression);
                expressionResolver.parse(hqlParserContext);
            } else if (child instanceof TerminalNodeImpl) {
                hqlParserContext.appendQuery(child.getText());
            } else {
                parse(child, hqlParserContext);
            }
        }
    }
}
