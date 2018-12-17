package com.wavemaker.runtime.data.filter.parser;

import org.antlr.v4.runtime.BaseErrorListener;
import org.antlr.v4.runtime.RecognitionException;
import org.antlr.v4.runtime.Recognizer;
import org.antlr.v4.runtime.TokenStream;
import org.antlr.v4.runtime.misc.ParseCancellationException;

import com.wavemaker.commons.MessageResource;
import com.wavemaker.runtime.data.exception.HqlGrammarException;

public class WMHqlAntlrErrorListner extends BaseErrorListener {

    @Override
    public void syntaxError(Recognizer<?, ?> recognizer, Object offendingSymbol, int line, int charPositionInLine, String msg, RecognitionException e)
            throws ParseCancellationException {
        String inputQuery = ((TokenStream) recognizer.getInputStream()).getTokenSource().getInputStream().toString();


        throw new HqlGrammarException(
                MessageResource.create("Syntax error in '{0}' at {1}."), inputQuery, charPositionInLine, msg
        );
    }
}