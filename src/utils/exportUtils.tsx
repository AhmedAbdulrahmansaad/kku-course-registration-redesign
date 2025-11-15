/**
 * Utility functions for exporting data to various formats
 * Supports: PDF, Word (DOCX), Text (TXT)
 */

import { toast } from 'sonner@2.0.3';

// Helper to generate timestamp
const getTimestamp = () => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

// Helper to generate filename
const generateFilename = (basename: string, extension: string) => {
  return `${basename}_${getTimestamp()}.${extension}`;
};

/**
 * Export data as Plain Text (.txt)
 */
export const exportAsText = (content: string, filename: string, language: 'ar' | 'en') => {
  try {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = generateFilename(filename, 'txt');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    toast.success(
      language === 'ar' 
        ? '✅ تم تحميل الملف النصي بنجاح' 
        : '✅ Text file downloaded successfully'
    );
  } catch (error) {
    console.error('Error exporting text:', error);
    toast.error(
      language === 'ar' 
        ? '❌ فشل تحميل الملف النصي' 
        : '❌ Failed to download text file'
    );
  }
};

/**
 * Export data as Word Document (.docx)
 * Uses simple HTML to DOCX conversion
 */
export const exportAsWord = (htmlContent: string, filename: string, language: 'ar' | 'en') => {
  try {
    // Create HTML template for Word
    const wordHtml = `
      <!DOCTYPE html>
      <html dir="${language === 'ar' ? 'rtl' : 'ltr'}">
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: ${language === 'ar' ? "'Tajawal', Arial" : "'Arial', sans-serif"};
            direction: ${language === 'ar' ? 'rtl' : 'ltr'};
            padding: 20px;
            line-height: 1.8;
          }
          table {
            border-collapse: collapse;
            width: 100%;
            margin: 20px 0;
          }
          th, td {
            border: 1px solid #000;
            padding: 8px;
            text-align: ${language === 'ar' ? 'right' : 'left'};
          }
          th {
            background-color: #184A2C;
            color: white;
            font-weight: bold;
          }
          h1, h2, h3 {
            color: #184A2C;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        ${htmlContent}
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', wordHtml], {
      type: 'application/msword;charset=utf-8'
    });
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = generateFilename(filename, 'doc');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    toast.success(
      language === 'ar' 
        ? '✅ تم تحميل ملف Word بنجاح' 
        : '✅ Word document downloaded successfully'
    );
  } catch (error) {
    console.error('Error exporting Word:', error);
    toast.error(
      language === 'ar' 
        ? '❌ فشل تحميل ملف Word' 
        : '❌ Failed to download Word document'
    );
  }
};

/**
 * Export data as PDF
 * Uses browser print functionality with custom styling
 */
export const exportAsPDF = (htmlContent: string, filename: string, language: 'ar' | 'en') => {
  try {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
      toast.error(
        language === 'ar' 
          ? '⚠️ يرجى السماح بالنوافذ المنبثقة' 
          : '⚠️ Please allow pop-ups'
      );
      return;
    }

    const pdfHtml = `
      <!DOCTYPE html>
      <html dir="${language === 'ar' ? 'rtl' : 'ltr'}">
      <head>
        <meta charset="UTF-8">
        <title>${filename}</title>
        <style>
          @page {
            size: A4;
            margin: 20mm;
          }
          
          body {
            font-family: ${language === 'ar' ? "'Tajawal', Arial" : "'Arial', sans-serif"};
            direction: ${language === 'ar' ? 'rtl' : 'ltr'};
            padding: 0;
            margin: 0;
            line-height: 1.6;
            font-size: 12pt;
          }
          
          .page {
            page-break-after: always;
          }
          
          table {
            border-collapse: collapse;
            width: 100%;
            margin: 15px 0;
            font-size: 11pt;
          }
          
          th, td {
            border: 1px solid #333;
            padding: 8px;
            text-align: ${language === 'ar' ? 'right' : 'left'};
          }
          
          th {
            background-color: #184A2C;
            color: white;
            font-weight: bold;
          }
          
          h1 {
            color: #184A2C;
            font-size: 20pt;
            margin-bottom: 10px;
            text-align: center;
          }
          
          h2 {
            color: #184A2C;
            font-size: 16pt;
            margin-top: 20px;
            margin-bottom: 10px;
          }
          
          h3 {
            color: #184A2C;
            font-size: 14pt;
            margin-top: 15px;
            margin-bottom: 8px;
          }
          
          .header {
            text-align: center;
            margin-bottom: 25px;
            border-bottom: 3px solid #184A2C;
            padding-bottom: 15px;
          }
          
          .logo {
            width: 80px;
            height: 80px;
            margin: 0 auto 10px;
          }
          
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 10pt;
            color: #666;
            border-top: 1px solid #ccc;
            padding-top: 15px;
          }
          
          .info-box {
            background-color: #f5f5f5;
            border: 1px solid #ddd;
            padding: 10px;
            margin: 10px 0;
            border-radius: 5px;
          }
          
          .grade-badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 3px;
            font-weight: bold;
          }
          
          .grade-a { background-color: #22c55e; color: white; }
          .grade-b { background-color: #3b82f6; color: white; }
          .grade-c { background-color: #eab308; color: white; }
          .grade-d { background-color: #f97316; color: white; }
          .grade-f { background-color: #ef4444; color: white; }
          
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        ${htmlContent}
      </body>
      </html>
    `;

    printWindow.document.write(pdfHtml);
    printWindow.document.close();

    // Wait for content to load then print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        
        // Close window after printing
        setTimeout(() => {
          printWindow.close();
        }, 1000);
      }, 500);
    };
    
    toast.success(
      language === 'ar' 
        ? '📄 جاري فتح نافذة الطباعة...' 
        : '📄 Opening print dialog...'
    );
  } catch (error) {
    console.error('Error exporting PDF:', error);
    toast.error(
      language === 'ar' 
        ? '❌ فشل تصدير PDF' 
        : '❌ Failed to export PDF'
    );
  }
};

/**
 * Generate HTML header for exports
 */
export const generateExportHeader = (
  title: string,
  subtitle: string,
  studentInfo: any,
  language: 'ar' | 'en'
) => {
  const timestamp = new Date().toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return `
    <div class="header">
      <div class="logo">
        <svg viewBox="0 0 100 100" style="width: 100%; height: 100%;">
          <circle cx="50" cy="50" r="45" fill="#184A2C"/>
          <text x="50" y="60" text-anchor="middle" fill="#D4AF37" font-size="40" font-weight="bold">K</text>
        </svg>
      </div>
      <h1>${language === 'ar' ? 'جامعة الملك خالد' : 'King Khalid University'}</h1>
      <p style="margin: 5px 0; color: #666;">
        ${language === 'ar' ? 'كلية إدارة الأعمال - قسم نظم المعلومات الإدارية' : 'College of Business - MIS Department'}
      </p>
      <h2 style="margin-top: 15px;">${title}</h2>
      ${subtitle ? `<p style="color: #666;">${subtitle}</p>` : ''}
    </div>
    
    ${studentInfo ? `
      <div class="info-box">
        <table style="border: none;">
          <tr>
            <td style="border: none; font-weight: bold;">${language === 'ar' ? 'اسم الطالب:' : 'Student Name:'}</td>
            <td style="border: none;">${studentInfo.name || ''}</td>
            <td style="border: none; font-weight: bold;">${language === 'ar' ? 'الرقم الجامعي:' : 'Student ID:'}</td>
            <td style="border: none;">${studentInfo.id || ''}</td>
          </tr>
          <tr>
            <td style="border: none; font-weight: bold;">${language === 'ar' ? 'التخصص:' : 'Major:'}</td>
            <td style="border: none;">${studentInfo.major || ''}</td>
            <td style="border: none; font-weight: bold;">${language === 'ar' ? 'المستوى:' : 'Level:'}</td>
            <td style="border: none;">${studentInfo.level || ''}</td>
          </tr>
        </table>
      </div>
    ` : ''}
  `;
};

/**
 * Generate HTML footer for exports
 */
export const generateExportFooter = (language: 'ar' | 'en') => {
  const timestamp = new Date().toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return `
    <div class="footer">
      <p>${language === 'ar' ? 'تاريخ الطباعة:' : 'Print Date:'} ${timestamp}</p>
      <p>${language === 'ar' ? 'نظام تسجيل المقررات - جامعة الملك خالد' : 'Course Registration System - King Khalid University'}</p>
      <p>© 2025 ${language === 'ar' ? 'جميع الحقوق محفوظة' : 'All Rights Reserved'}</p>
    </div>
  `;
};
