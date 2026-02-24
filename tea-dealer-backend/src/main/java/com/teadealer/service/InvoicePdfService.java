package com.teadealer.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.itextpdf.text.Document;
import com.itextpdf.text.Image;
import com.itextpdf.text.PageSize;
import com.itextpdf.text.Rectangle;
import com.itextpdf.text.pdf.BaseFont;
import com.itextpdf.text.pdf.PdfContentByte;
import com.itextpdf.text.pdf.PdfWriter;
import com.teadealer.model.Collection;
import com.teadealer.model.Invoice;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class InvoicePdfService {

    private static final String SETTING_KEY_INCLUDE_GRAPHICS = "invoice_include_graphics";
    private static final String SETTING_KEY_PAGE_SIZE = "invoice_page_size";
    private static final String SETTING_KEY_TEMPLATE_IMAGE = "invoice_template_image";
    private static final String SETTING_KEY_TEMPLATE_FIELDS = "invoice_template_fields";
    private static final String SETTING_KEY_TEMPLATE_SIZE = "invoice_template_size";
    private static final String SETTING_KEY_TEMPLATE_FONT_SIZE = "invoice_template_font_size";
    private static final String SETTING_KEY_TEMPLATE_FONT_FAMILY = "invoice_template_font_family";
    private static final String SETTING_KEY_SPECIAL_NOTE_1_ENABLED = "special_note_1_enabled";
    private static final String SETTING_KEY_SPECIAL_NOTE_1_TEXT = "special_note_1_text";
    private static final String SETTING_KEY_SPECIAL_NOTE_2_ENABLED = "special_note_2_enabled";
    private static final String SETTING_KEY_SPECIAL_NOTE_2_TEXT = "special_note_2_text";

    // Months array
    private static final String[] MONTHS = {"January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"};

    @Autowired
    private AppSettingsService appSettingsService;

    @Autowired
    private CollectionService collectionService;

    private ObjectMapper objectMapper = new ObjectMapper();

    public byte[] generateInvoicePdf(Invoice invoice) throws Exception {
        boolean includeGraphics = "true".equalsIgnoreCase(
                appSettingsService.getSettingValue(SETTING_KEY_INCLUDE_GRAPHICS));

        if (includeGraphics) {
            return generateTemplateBasedPdf(invoice);
        } else {
            return generateTextOnlyPdf(invoice);
        }
    }

    /**
     * Generate PDF using the configured template image with field overlays
     */
    private byte[] generateTemplateBasedPdf(Invoice invoice) throws Exception {
        // Load template configuration
        String templateImageBase64 = appSettingsService.getSettingValue(SETTING_KEY_TEMPLATE_IMAGE);
        String fieldsJson = appSettingsService.getSettingValue(SETTING_KEY_TEMPLATE_FIELDS);
        String sizeJson = appSettingsService.getSettingValue(SETTING_KEY_TEMPLATE_SIZE);
        String fontSizeStr = appSettingsService.getSettingValue(SETTING_KEY_TEMPLATE_FONT_SIZE);

        // If no template configured, fall back to text-only
        if (templateImageBase64 == null || templateImageBase64.isEmpty()) {
            return generateTextOnlyPdf(invoice);
        }

        // Parse fields
        List<Map<String, Object>> fields = new ArrayList<>();
        if (fieldsJson != null && !fieldsJson.isEmpty()) {
            fields = objectMapper.readValue(fieldsJson, new TypeReference<List<Map<String, Object>>>() {});
        }

        // Parse template size
        int templateWidth = 800;
        int templateHeight = 1000;
        if (sizeJson != null && !sizeJson.isEmpty()) {
            Map<String, Object> size = objectMapper.readValue(sizeJson, new TypeReference<Map<String, Object>>() {});
            templateWidth = ((Number) size.getOrDefault("width", 800)).intValue();
            templateHeight = ((Number) size.getOrDefault("height", 1000)).intValue();
        }

        // Font size
        int fontSize = fontSizeStr != null ? Integer.parseInt(fontSizeStr) : 12;

        // Get page size setting
        String pageSizeSetting = appSettingsService.getSettingValue(SETTING_KEY_PAGE_SIZE);
        Rectangle pageSize = getPageSize(pageSizeSetting);

        // Prepare field values
        Map<String, String> fieldValues = prepareFieldValues(invoice);

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        Document document = new Document(pageSize, 0, 0, 0, 0);
        PdfWriter writer = PdfWriter.getInstance(document, baos);

        document.open();

        // Load and add template image as background
        byte[] imageBytes = Base64.getDecoder().decode(
                templateImageBase64.contains(",") ?
                        templateImageBase64.split(",")[1] : templateImageBase64);
        Image templateImage = Image.getInstance(imageBytes);

        // Scale to fit page
        templateImage.scaleToFit(pageSize.getWidth(), pageSize.getHeight());
        templateImage.setAbsolutePosition(0, pageSize.getHeight() - templateImage.getScaledHeight());
        document.add(templateImage);

        // Calculate scale factors
        float scaleX = templateImage.getScaledWidth() / templateWidth;
        float scaleY = templateImage.getScaledHeight() / templateHeight;

        // Add field values at configured positions
        PdfContentByte canvas = writer.getDirectContent();
        // Use Courier font (monospace) - better for dot matrix printers
        BaseFont baseFont = BaseFont.createFont(BaseFont.COURIER, BaseFont.CP1252, BaseFont.NOT_EMBEDDED);

        for (Map<String, Object> field : fields) {
            String fieldId = (String) field.get("id");
            // Use baseId if available (for multi-drop fields like month_2, year_2)
            String lookupId = field.containsKey("baseId") ? (String) field.get("baseId") : fieldId;
            String value = fieldValues.get(lookupId);

            if (value == null || value.isEmpty()) continue;

            // Get position (percentage based)
            double xPercent = ((Number) field.get("x")).doubleValue();
            double yPercent = ((Number) field.get("y")).doubleValue();

            // Get field-specific font size or use global
            int fieldFontSize = field.containsKey("fontSize") ?
                    ((Number) field.get("fontSize")).intValue() : fontSize;

            // Get alignment
            String align = (String) field.getOrDefault("align", "left");

            // Calculate absolute position
            float x = (float) (xPercent / 100.0 * templateImage.getScaledWidth());
            // Y is inverted in PDF (0 is bottom)
            float y = pageSize.getHeight() - templateImage.getScaledHeight() +
                    templateImage.getScaledHeight() - (float) (yPercent / 100.0 * templateImage.getScaledHeight());

            // Adjust for alignment
            float textWidth = baseFont.getWidthPoint(value, fieldFontSize);
            if ("center".equals(align)) {
                x -= textWidth / 2;
            } else if ("right".equals(align)) {
                x -= textWidth;
            }

            // Draw text
            canvas.beginText();
            canvas.setFontAndSize(baseFont, fieldFontSize);
            canvas.setTextMatrix(x, y);
            canvas.showText(value);
            canvas.endText();
        }

        document.close();
        return baos.toByteArray();
    }

    /**
     * Generate text-only PDF using the same template field positions and fonts,
     * but without the background image (for dot matrix printers with pre-printed forms)
     */
    private byte[] generateTextOnlyPdf(Invoice invoice) throws Exception {
        // Load template configuration (same as graphics version)
        String fieldsJson = appSettingsService.getSettingValue(SETTING_KEY_TEMPLATE_FIELDS);
        String sizeJson = appSettingsService.getSettingValue(SETTING_KEY_TEMPLATE_SIZE);
        String fontSizeStr = appSettingsService.getSettingValue(SETTING_KEY_TEMPLATE_FONT_SIZE);

        // Parse fields
        List<Map<String, Object>> fields = new ArrayList<>();
        if (fieldsJson != null && !fieldsJson.isEmpty()) {
            fields = objectMapper.readValue(fieldsJson, new TypeReference<List<Map<String, Object>>>() {});
        }

        // Parse template size
        int templateWidth = 800;
        int templateHeight = 1000;
        if (sizeJson != null && !sizeJson.isEmpty()) {
            Map<String, Object> size = objectMapper.readValue(sizeJson, new TypeReference<Map<String, Object>>() {});
            templateWidth = ((Number) size.getOrDefault("width", 800)).intValue();
            templateHeight = ((Number) size.getOrDefault("height", 1000)).intValue();
        }

        // Font size
        int fontSize = fontSizeStr != null ? Integer.parseInt(fontSizeStr) : 12;

        // Get page size setting
        String pageSizeSetting = appSettingsService.getSettingValue(SETTING_KEY_PAGE_SIZE);
        Rectangle pageSize = getPageSize(pageSizeSetting);

        // Prepare field values
        Map<String, String> fieldValues = prepareFieldValues(invoice);

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        Document document = new Document(pageSize, 0, 0, 0, 0);
        PdfWriter writer = PdfWriter.getInstance(document, baos);

        document.open();

        // Calculate the scaled dimensions (same as if we had the template image)
        // We scale the template to fit the page while maintaining aspect ratio
        float templateAspect = (float) templateWidth / templateHeight;
        float pageAspect = pageSize.getWidth() / pageSize.getHeight();

        float scaledWidth, scaledHeight;
        if (templateAspect > pageAspect) {
            // Template is wider - fit to page width
            scaledWidth = pageSize.getWidth();
            scaledHeight = scaledWidth / templateAspect;
        } else {
            // Template is taller - fit to page height
            scaledHeight = pageSize.getHeight();
            scaledWidth = scaledHeight * templateAspect;
        }

        // Add field values at configured positions (same positioning as graphics version)
        PdfContentByte canvas = writer.getDirectContent();
        BaseFont baseFont = BaseFont.createFont(BaseFont.COURIER, BaseFont.CP1252, BaseFont.NOT_EMBEDDED);

        for (Map<String, Object> field : fields) {
            String fieldId = (String) field.get("id");
            // Use baseId if available (for multi-drop fields like month_2, year_2)
            String lookupId = field.containsKey("baseId") ? (String) field.get("baseId") : fieldId;
            String value = fieldValues.get(lookupId);

            if (value == null || value.isEmpty()) continue;

            // Get position (percentage based)
            double xPercent = ((Number) field.get("x")).doubleValue();
            double yPercent = ((Number) field.get("y")).doubleValue();

            // Get field-specific font size or use global
            int fieldFontSize = field.containsKey("fontSize") ?
                    ((Number) field.get("fontSize")).intValue() : fontSize;

            // Get alignment
            String align = (String) field.getOrDefault("align", "left");

            // Calculate absolute position (same formula as graphics version)
            float x = (float) (xPercent / 100.0 * scaledWidth);
            // Y is inverted in PDF (0 is bottom)
            float y = pageSize.getHeight() - scaledHeight +
                    scaledHeight - (float) (yPercent / 100.0 * scaledHeight);

            // Adjust for alignment
            float textWidth = baseFont.getWidthPoint(value, fieldFontSize);
            if ("center".equals(align)) {
                x -= textWidth / 2;
            } else if ("right".equals(align)) {
                x -= textWidth;
            }

            // Draw text
            canvas.beginText();
            canvas.setFontAndSize(baseFont, fieldFontSize);
            canvas.setTextMatrix(x, y);
            canvas.showText(value);
            canvas.endText();
        }

        document.close();
        return baos.toByteArray();
    }

    /**
     * Prepare field values map for template overlay
     */
    private Map<String, String> prepareFieldValues(Invoice invoice) {
        Map<String, String> values = new HashMap<>();

        values.put("bookNumber", invoice.getBookNumber() != null ? invoice.getBookNumber() : "");
        values.put("customerName", invoice.getCustomerName() != null ? invoice.getCustomerName() : "");
        values.put("customerNameSinhala", invoice.getCustomerNameSinhala() != null ? invoice.getCustomerNameSinhala() : "");
        values.put("month", invoice.getMonth() != null ? MONTHS[invoice.getMonth() - 1] : "");
        values.put("year", invoice.getYear() != null ? invoice.getYear().toString() : "");

        // Kg values
        values.put("grade1Kg", formatKg(invoice.getGrade1Kg()));
        values.put("grade2Kg", formatKg(invoice.getGrade2Kg()));
        BigDecimal totalKg = (invoice.getGrade1Kg() != null ? invoice.getGrade1Kg() : BigDecimal.ZERO)
                .add(invoice.getGrade2Kg() != null ? invoice.getGrade2Kg() : BigDecimal.ZERO);
        values.put("totalKg", formatKg(totalKg));
        values.put("supplyDeductionKg", formatKg(invoice.getSupplyDeductionKg()));
        values.put("supplyDeductionPercent", invoice.getSupplyDeductionPercentage() != null ?
                invoice.getSupplyDeductionPercentage().toString() : "0");

        // Grade-specific deduction and net kg values
        BigDecimal grade1Kg = invoice.getGrade1Kg() != null ? invoice.getGrade1Kg() : BigDecimal.ZERO;
        BigDecimal grade2Kg = invoice.getGrade2Kg() != null ? invoice.getGrade2Kg() : BigDecimal.ZERO;
        BigDecimal deductionPercent = invoice.getSupplyDeductionPercentage() != null ?
                invoice.getSupplyDeductionPercentage() : BigDecimal.ZERO;

        BigDecimal grade1Deduction = grade1Kg.multiply(deductionPercent).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        BigDecimal grade2Deduction = grade2Kg.multiply(deductionPercent).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        BigDecimal grade1NetKg = grade1Kg.subtract(grade1Deduction);
        BigDecimal grade2NetKg = grade2Kg.subtract(grade2Deduction);

        values.put("grade1DeductionKg", formatKg(grade1Deduction));
        values.put("grade2DeductionKg", formatKg(grade2Deduction));
        values.put("grade1NetKg", formatKg(grade1NetKg));
        values.put("grade2NetKg", formatKg(grade2NetKg));

        values.put("payableKg", formatKg(invoice.getPayableKg()));

        // Rates
        values.put("grade1Rate", formatAmount(invoice.getGrade1Rate()));
        values.put("grade2Rate", formatAmount(invoice.getGrade2Rate()));

        // Amounts
        values.put("grade1Amount", formatAmount(invoice.getGrade1Amount()));
        values.put("grade2Amount", formatAmount(invoice.getGrade2Amount()));
        values.put("totalAmount", formatAmount(invoice.getTotalAmount()));
        values.put("totalDeductions", formatAmount(invoice.getTotalDeductions()));
        values.put("netAmount", formatAmount(invoice.getNetAmount() != null ? invoice.getNetAmount().abs() : BigDecimal.ZERO));

        // Deductions
        values.put("arrears", formatAmount(invoice.getLastMonthArrears()));
        values.put("advance", formatAmount(invoice.getAdvanceAmount()));
        values.put("loan", formatAmount(invoice.getLoanAmount()));
        values.put("fertilizer1", formatAmount(invoice.getFertilizer1Amount()));
        values.put("fertilizer2", formatAmount(invoice.getFertilizer2Amount()));
        values.put("teaPackets", formatAmount(invoice.getTeaPacketsTotal()));
        values.put("transport", formatAmount(invoice.getTransportDeduction()));
        values.put("stampFee", formatAmount(invoice.getStampFee()));
        values.put("otherDeductions", formatAmount(invoice.getOtherDeductions()));
        values.put("agrochemicals", formatAmount(invoice.getAgrochemicalsAmount()));

        // Daily collection fields
        List<Collection> collections = getCollectionsForInvoice(invoice);
        Map<Integer, BigDecimal> dailyTotals = new HashMap<>();
        for (Collection col : collections) {
            int day = col.getCollectionDate().getDayOfMonth();
            BigDecimal weight = col.getWeightKg() != null ? col.getWeightKg() : BigDecimal.ZERO;
            dailyTotals.merge(day, weight, BigDecimal::add);
        }

        for (int day = 1; day <= 31; day++) {
            String fieldId = "day" + String.format("%02d", day);
            BigDecimal dayTotal = dailyTotals.get(day);
            if (dayTotal != null && dayTotal.compareTo(BigDecimal.ZERO) > 0) {
                values.put(fieldId, dayTotal.setScale(0, RoundingMode.HALF_UP).toString());
            } else {
                values.put(fieldId, "-");
            }
        }

        // Special notes
        String note1Enabled = appSettingsService.getSettingValue(SETTING_KEY_SPECIAL_NOTE_1_ENABLED);
        String note1Text = appSettingsService.getSettingValue(SETTING_KEY_SPECIAL_NOTE_1_TEXT);
        String note2Enabled = appSettingsService.getSettingValue(SETTING_KEY_SPECIAL_NOTE_2_ENABLED);
        String note2Text = appSettingsService.getSettingValue(SETTING_KEY_SPECIAL_NOTE_2_TEXT);

        values.put("specialNote1", "true".equalsIgnoreCase(note1Enabled) && note1Text != null ? note1Text : "");
        values.put("specialNote2", "true".equalsIgnoreCase(note2Enabled) && note2Text != null ? note2Text : "");

        return values;
    }

    private Rectangle getPageSize(String setting) {
        if (setting == null) {
            return PageSize.A5;
        }
        switch (setting.toUpperCase()) {
            case "A4":
                return PageSize.A4;
            case "A6":
                return PageSize.A6;
            case "LETTER":
                return PageSize.LETTER;
            case "A5":
            default:
                return PageSize.A5;
        }
    }

    private boolean hasValue(BigDecimal value) {
        return value != null && value.compareTo(BigDecimal.ZERO) > 0;
    }

    private String formatAmount(BigDecimal amount) {
        if (amount == null) return "0.00";
        return String.format("%,.2f", amount);
    }

    private String formatKg(BigDecimal kg) {
        if (kg == null) return "0";
        return kg.setScale(0, RoundingMode.HALF_UP).toString();
    }

    private List<Collection> getCollectionsForInvoice(Invoice invoice) {
        LocalDate startDate = LocalDate.of(invoice.getYear(), invoice.getMonth(), 1);
        LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());
        // Use customerId for more reliable matching
        return collectionService.getCollectionsByCustomerIdAndDateRange(
                invoice.getCustomer().getId(), startDate, endDate);
    }
}
