grammar HqlFilter;

options {
    // antlr will generate java lexer and parser
    language = Java;
}

@header {
package com.wavemaker.runtime.data.filter.parser.antlr4;
}

/*
 * Parser Rules
 */
whereClause : logicalExpression EOF;

logicalExpression : BRAC_OPEN logicalExpression BRAC_CLOSE | logicalExpression (AND | OR) logicalExpression | expression ( (AND | OR) logicalExpression )* ;

expression : key condition;

condition : (comparison | between | in | notIn | like | notLike | isNull | isNotNull);

comparison :  OPERATOR (string | BOOLEAN_VALUE | number | NULL | function);
between : BETWEEN ((number AND number) | (string AND string));
in : IN BRAC_OPEN (commaSeparatedStrings |  commaSeparatedNumbers) BRAC_CLOSE;
notIn : NOT IN BRAC_OPEN (commaSeparatedStrings |  commaSeparatedNumbers) BRAC_CLOSE;
like : LIKE string ;
notLike : NOT LIKE string ;
isNull : IS NULL;
isNotNull : IS NOT NULL;

//Comma saperated values
commaSeparatedStrings : string (COMMA string)*;
commaSeparatedNumbers : NUMBER_VALUE (COMMA NUMBER_VALUE)*;


//Handling hql functions
key : FUNCTION BRAC_OPEN KEY BRAC_CLOSE |  KEY;
string : FUNCTION BRAC_OPEN STRING_VALUE BRAC_CLOSE |  STRING_VALUE;
number : FUNCTION BRAC_OPEN NUMBER_VALUE BRAC_CLOSE |  NUMBER_VALUE;
function : FUNCTION BRAC_OPEN KEY? BRAC_CLOSE;

/*
 * Lexer Rules
 */
fragment A:('a'|'A');
fragment B:('b'|'B');
fragment C:('c'|'C');
fragment D:('d'|'D');
fragment E:('e'|'E');
fragment F:('f'|'F');
fragment G:('g'|'G');
fragment H:('h'|'H');
fragment I:('i'|'I');
fragment J:('j'|'J');
fragment K:('k'|'K');
fragment L:('l'|'L');
fragment M:('m'|'M');
fragment N:('n'|'N');
fragment O:('o'|'O');
fragment P:('p'|'P');
fragment Q:('q'|'Q');
fragment R:('r'|'R');
fragment S:('s'|'S');
fragment T:('t'|'T');
fragment U:('u'|'U');
fragment V:('v'|'V');
fragment W:('w'|'W');
fragment X:('x'|'X');
fragment Y:('y'|'Y');
fragment Z:('z'|'Z');

fragment DOT : '.';
fragment COLON : ':';
fragment ESCAPE_QUOTE : ( '\'' | '\\' )  '\'' ; // \' or '' (escape quote)
fragment ALL_BUT_QUOTE : ~('\''); // all the charecters except '
fragment NUMBER : ('0'..'9');
fragment ALPHABET : ('_'|'a'..'z'|'A'..'Z');
fragment ALPHA_NUMERIC : ( ALPHABET | NUMBER );
fragment STRING : (ESCAPE_QUOTE|ALL_BUT_QUOTE)* ; // all the content which can be inside singlequotes, this includes escaped singlequotes.
fragment EQ : '=';
fragment NE : '!=' | '<>';
fragment LT : '<';
fragment LE : '<=';
fragment GT : '>';
fragment GE : '>=';
fragment US : '_';

WHITESPACE : ' ' -> skip ;


COMMA : ',';
BRAC_OPEN : '(';
BRAC_CLOSE : ')';
SINGLE_QUOTE : '\'';
HYPHEN : '-';

//Case insensitive words
BETWEEN : B E T W E E N ;
IN : I N ;
AND : A N D ;
LIKE : L I K E ;
OR : O R ;
IS : I S ;
NOT : N O T ;
NULL : N U L L ;

//Hql Functions
FUNCTION : 'current_date' |
             'current_time' |
             'current_timestamp' |
//             'substring' |
//             'trim' |
//             'upper' |
//             'length' |
//             'locate' |
//             'abs' |
//             'sqrt' |
//             'bit_length' |
//             'mod' |
//             'coalesce' |
//             'nullif' |
//             'str' |
//             'cast' |
//             'extract' |
//             'index' |
//             'size' |
//             'minelement' |
//             'maxelement' |
//             'minindex' |
//             'maxindex' |
//             'elements' |
//             'sign' |
//             'trunc' |
//             'rtrim' |
//             'sin' |
             'lower';


OPERATOR : EQ | NE |  GT | LT | GE | LE ;
BOOLEAN_VALUE :  T R U E | F A L S E ;
NUMBER_VALUE : SINGLE_QUOTE NUMBER+(DOT NUMBER+)? SINGLE_QUOTE | NUMBER+(DOT NUMBER+)?
               | HYPHEN NUMBER+(DOT NUMBER+)? | SINGLE_QUOTE HYPHEN NUMBER+(DOT NUMBER+)? SINGLE_QUOTE;
STRING_VALUE : SINGLE_QUOTE STRING SINGLE_QUOTE;

KEY:  (ALPHABET ALPHA_NUMERIC*) (DOT ALPHABET ALPHA_NUMERIC*)*;

