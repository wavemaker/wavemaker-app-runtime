package com.wavemaker.runtime.data.export;

import java.awt.*;
import java.text.NumberFormat;
import java.util.Locale;

import net.sf.dynamicreports.report.base.expression.AbstractValueFormatter;
import net.sf.dynamicreports.report.builder.DynamicReports;
import net.sf.dynamicreports.report.builder.ReportTemplateBuilder;
import net.sf.dynamicreports.report.builder.component.ComponentBuilder;
import net.sf.dynamicreports.report.builder.component.Components;
import net.sf.dynamicreports.report.builder.style.StyleBuilder;
import net.sf.dynamicreports.report.builder.style.Styles;
import net.sf.dynamicreports.report.builder.tableofcontents.TableOfContentsCustomizer;
import net.sf.dynamicreports.report.constant.HorizontalAlignment;
import net.sf.dynamicreports.report.constant.VerticalAlignment;
import net.sf.dynamicreports.report.definition.ReportParameters;

/**
 * @author <a href="mailto:anusha.dharmasagar@wavemaker.com">Anusha Dharmasagar</a>
 * @since 9/5/16
 */
public class Templates {
    public static final StyleBuilder rootStyle;
    public static final StyleBuilder boldStyle;
    public static final StyleBuilder italicStyle;
    public static final StyleBuilder boldCenteredStyle;
    public static final StyleBuilder bold18CenteredStyle;
    public static final StyleBuilder columnStyle;
    public static final StyleBuilder columnTitleStyle;
    public static final StyleBuilder groupStyle;
    public static final StyleBuilder subtotalStyle;

    public static final ReportTemplateBuilder reportTemplate;
    public static final ComponentBuilder<?, ?> footerComponent;

    static {
        rootStyle = Styles.style().setPadding(2);
        boldStyle = Styles.style(rootStyle).bold();
        italicStyle = Styles.style(rootStyle).italic();
        boldCenteredStyle = Styles.style(boldStyle)
                .setAlignment(HorizontalAlignment.CENTER, VerticalAlignment.MIDDLE);
        bold18CenteredStyle = Styles.style(boldCenteredStyle)
                .setFontSize(18);
        columnStyle = Styles.style(rootStyle).setVerticalAlignment(VerticalAlignment.MIDDLE);
        columnTitleStyle = Styles.style(columnStyle)
                .setBorder(Styles.pen1Point())
                .setHorizontalAlignment(HorizontalAlignment.CENTER)
//                .setBackgroundColor(Color.LIGHT_GRAY)
                .setBackgroundColor(new Color(58, 132, 123))
                .bold();
        groupStyle = Styles.style(boldStyle)
                .setHorizontalAlignment(HorizontalAlignment.LEFT);
        subtotalStyle = Styles.style(boldStyle)
                .setTopBorder(Styles.pen1Point());

        StyleBuilder crosstabGroupStyle = Styles.style(columnTitleStyle);

        TableOfContentsCustomizer tableOfContentsCustomizer = new TableOfContentsCustomizer();
        tableOfContentsCustomizer.setHeadingStyle(0, Styles.style(rootStyle).bold());


        ReportTemplateBuilder template = DynamicReports.template();

        reportTemplate = template
                .setLocale(new Locale("en", "in"))
                .setColumnStyle(columnStyle)
                .setColumnTitleStyle(columnTitleStyle)
                .setGroupStyle(groupStyle)
                .setGroupTitleStyle(groupStyle)
                .setSubtotalStyle(subtotalStyle)
                .highlightDetailEvenRows()
                .setTableOfContentsCustomizer(tableOfContentsCustomizer);

        footerComponent = Components.pageXofY()
                .setStyle(
                        Styles.style(boldCenteredStyle)
                                .setTopBorder(Styles.pen1Point()));
    }

    public static ComponentBuilder<?, ?> createTitleComponent(String label) {
        return Components.horizontalList()
                .add(Components.text(label).setStyle(bold18CenteredStyle).setHorizontalAlignment(HorizontalAlignment.RIGHT))
                .newRow()
                .add(Components.line())
                .newRow()
                .add(Components.verticalGap(10));
    }

    public static CurrencyValueFormatter createCurrencyValueFormatter(String label) {
        return new CurrencyValueFormatter(label);
    }


    private static class CurrencyValueFormatter extends AbstractValueFormatter<String, Number> {
        private static final long serialVersionUID = 1L;

        //to append a label
        private String label;

        public CurrencyValueFormatter(String label) {
            this.label = label;
        }

        public String format(Number value, ReportParameters reportParameters) {
//            return label + currencyType.valueToString(value, reportParameters.getLocale());
            Double amount = value.doubleValue();
            Locale locale = reportParameters.getLocale();
            NumberFormat formatter = NumberFormat.getCurrencyInstance(locale);
            return formatter.format(amount);
//            Format format = NumberFormat.getCurrencyInstance(new Locale("en", "in"));
//            return format.format(new BigDecimal(value.toString()));
        }
    }
}

