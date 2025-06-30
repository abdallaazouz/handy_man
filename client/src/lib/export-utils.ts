import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export interface TaskReportData {
  id: number;
  taskNumber: string;
  title: string;
  status: string;
  technicianName: string;
  clientName: string;
  scheduledDate: string;
  location: string;
  paymentStatus: string;
}

export interface TechnicianReportData {
  id: number;
  name: string;
  phone: string;
  completedTasks: number;
  performanceRating: number;
  totalRevenue: number;
}

export interface InvoiceReportData {
  id: number;
  invoiceNumber: string;
  clientName: string;
  technicianName: string;
  amount: number;
  status: string;
  issueDate: string;
  dueDate: string;
  paidDate?: string;
}

export class ExportUtils {
  static generateTaskReportPDF(tasks: TaskReportData[], language: string = 'de') {
    const doc = new jsPDF();
    
    // Set font for German characters
    doc.setFont('helvetica');
    
    // Title
    const title = language === 'de' ? 'Aufgabenbericht' : 'Task Report';
    doc.setFontSize(20);
    doc.text(title, 14, 22);
    
    // Date
    const dateStr = language === 'de' ? 
      `Erstellt am: ${new Date().toLocaleDateString('de-DE')}` :
      `Generated on: ${new Date().toLocaleDateString('en-US')}`;
    doc.setFontSize(10);
    doc.text(dateStr, 14, 30);
    
    // Table headers
    const headers = language === 'de' ? 
      [['Aufgaben-Nr.', 'Titel', 'Status', 'Techniker', 'Kunde', 'Datum', 'Ort', 'Zahlung']] :
      [['Task No.', 'Title', 'Status', 'Technician', 'Client', 'Date', 'Location', 'Payment']];
    
    // Table data
    const data = tasks.map(task => [
      this.sanitizeText(task.taskNumber),
      this.sanitizeText(task.title),
      this.sanitizeText(task.status),
      this.sanitizeText(task.technicianName),
      this.sanitizeText(task.clientName),
      this.sanitizeText(task.scheduledDate),
      this.sanitizeText(task.location),
      this.sanitizeText(task.paymentStatus)
    ]);
    
    autoTable(doc, {
      head: headers,
      body: data,
      startY: 40,
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [79, 70, 229],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
    });
    
    return doc;
  }
  
  static generateTechnicianReportPDF(technicians: TechnicianReportData[], language: string = 'de') {
    const doc = new jsPDF();
    
    doc.setFont('helvetica');
    
    const title = language === 'de' ? 'Technikerbericht' : 'Technician Report';
    doc.setFontSize(20);
    doc.text(title, 14, 22);
    
    const dateStr = language === 'de' ? 
      `Erstellt am: ${new Date().toLocaleDateString('de-DE')}` :
      `Generated on: ${new Date().toLocaleDateString('en-US')}`;
    doc.setFontSize(10);
    doc.text(dateStr, 14, 30);
    
    const headers = language === 'de' ? 
      [['Name', 'Telefon', 'Abgeschlossene Aufgaben', 'Bewertung', 'Gesamtumsatz']] :
      [['Name', 'Phone', 'Completed Tasks', 'Rating', 'Total Revenue']];
    
    const data = technicians.map(tech => [
      this.sanitizeText(tech.name),
      this.sanitizeText(tech.phone),
      tech.completedTasks.toString(),
      `${tech.performanceRating}/5`,
      `€${tech.totalRevenue.toFixed(2)}`
    ]);
    
    autoTable(doc, {
      head: headers,
      body: data,
      startY: 40,
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [34, 197, 94],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
    });
    
    return doc;
  }
  
  static generateInvoiceReportPDF(invoices: InvoiceReportData[], language: string = 'de') {
    const doc = new jsPDF();
    
    doc.setFont('helvetica');
    
    const title = language === 'de' ? 'Rechnungsbericht' : 'Invoice Report';
    doc.setFontSize(20);
    doc.text(title, 14, 22);
    
    const dateStr = language === 'de' ? 
      `Erstellt am: ${new Date().toLocaleDateString('de-DE')}` :
      `Generated on: ${new Date().toLocaleDateString('en-US')}`;
    doc.setFontSize(10);
    doc.text(dateStr, 14, 30);
    
    const headers = language === 'de' ? 
      [['Rechnungs-Nr.', 'Kunde', 'Techniker', 'Betrag', 'Status', 'Ausstellungsdatum', 'Fälligkeitsdatum']] :
      [['Invoice No.', 'Client', 'Technician', 'Amount', 'Status', 'Issue Date', 'Due Date']];
    
    const data = invoices.map(invoice => [
      this.sanitizeText(invoice.invoiceNumber),
      this.sanitizeText(invoice.clientName),
      this.sanitizeText(invoice.technicianName),
      `€${invoice.amount.toFixed(2)}`,
      this.sanitizeText(invoice.status),
      this.sanitizeText(invoice.issueDate),
      this.sanitizeText(invoice.dueDate)
    ]);
    
    // Calculate totals
    const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0);
    const paidAmount = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0);
    const unpaidAmount = totalAmount - paidAmount;
    
    autoTable(doc, {
      head: headers,
      body: data,
      startY: 40,
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [239, 68, 68],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
    });
    
    // Add summary
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    
    if (language === 'de') {
      doc.text('Zusammenfassung:', 14, finalY);
      doc.setFont('helvetica', 'normal');
      doc.text(`Gesamtbetrag: €${totalAmount.toFixed(2)}`, 14, finalY + 10);
      doc.text(`Bezahlt: €${paidAmount.toFixed(2)}`, 14, finalY + 20);
      doc.text(`Ausstehend: €${unpaidAmount.toFixed(2)}`, 14, finalY + 30);
    } else {
      doc.text('Summary:', 14, finalY);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Amount: €${totalAmount.toFixed(2)}`, 14, finalY + 10);
      doc.text(`Paid: €${paidAmount.toFixed(2)}`, 14, finalY + 20);
      doc.text(`Outstanding: €${unpaidAmount.toFixed(2)}`, 14, finalY + 30);
    }
    
    return doc;
  }
  
  static generateSingleInvoicePDF(invoice: any, language: string = 'de') {
    try {
      console.log('Creating new jsPDF document');
      const doc = new jsPDF();
      
      console.log('Setting font to helvetica');
      doc.setFont('helvetica');
      
      // Header
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      const title = language === 'de' ? 'RECHNUNG' : 'INVOICE';
      doc.text(title, 14, 25);
      
      // Invoice number
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`${language === 'de' ? 'Rechnungsnummer' : 'Invoice Number'}: ${this.sanitizeText(invoice.invoiceNumber || 'N/A')}`, 14, 40);
      
      // Dates
      doc.text(`${language === 'de' ? 'Ausstellungsdatum' : 'Issue Date'}: ${this.sanitizeText(invoice.issueDate || 'N/A')}`, 14, 50);
      doc.text(`${language === 'de' ? 'Fälligkeitsdatum' : 'Due Date'}: ${this.sanitizeText(invoice.dueDate || 'N/A')}`, 14, 60);
      
      // Client info
      doc.setFont('helvetica', 'bold');
      doc.text(language === 'de' ? 'Kunde:' : 'Client:', 14, 80);
      doc.setFont('helvetica', 'normal');
      doc.text(this.sanitizeText(invoice.clientName || 'N/A'), 14, 90);
      
      // Technician info
      doc.setFont('helvetica', 'bold');
      doc.text(language === 'de' ? 'Techniker:' : 'Technician:', 14, 110);
      doc.setFont('helvetica', 'normal');
      doc.text(this.sanitizeText(invoice.technicianName || 'N/A'), 14, 120);
      
      // Amount
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      const amount = typeof invoice.amount === 'number' ? invoice.amount : parseFloat(invoice.amount || 0);
      doc.text(`${language === 'de' ? 'Gesamtbetrag' : 'Total Amount'}: €${amount.toFixed(2)}`, 14, 150);
      
      // Status
      doc.setFontSize(12);
      const statusText = language === 'de' ? 
        (invoice.status === 'paid' ? 'BEZAHLT' : invoice.status === 'pending' ? 'AUSSTEHEND' : 'VERSENDET') :
        (invoice.status || 'UNKNOWN').toUpperCase();
      doc.text(`${language === 'de' ? 'Status' : 'Status'}: ${this.sanitizeText(statusText)}`, 14, 170);
      
      // Payment methods
      if (invoice.paymentMethod && invoice.paymentMethod.length > 0) {
        doc.text(`${language === 'de' ? 'Zahlungsmethoden' : 'Payment Methods'}:`, 14, 190);
        const methods = Array.isArray(invoice.paymentMethod) ? invoice.paymentMethod : [invoice.paymentMethod];
        methods.forEach((method: string, index: number) => {
          doc.text(`• ${this.sanitizeText(method)}`, 20, 200 + (index * 10));
        });
      }
      
      console.log('PDF document created successfully');
      return doc;
    } catch (error) {
      console.error('Error in generateSingleInvoicePDF:', error);
      throw new Error(`PDF generation failed: ${error.message}`);
    }
  }
  
  static exportToExcel(data: any[], fileName: string, sheetName: string) {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${fileName}.xlsx`);
  }
  
  static exportToCSV(data: any[], fileName: string) {
    const ws = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${fileName}.csv`);
  }
  
  static downloadPDF(doc: jsPDF, fileName: string) {
    try {
      console.log('Downloading PDF with filename:', `${fileName}.pdf`);
      doc.save(`${fileName}.pdf`);
      console.log('PDF download initiated successfully');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      throw new Error(`PDF download failed: ${error.message}`);
    }
  }

  // Helper method to sanitize text for PDF generation
  private static sanitizeText(text: string): string {
    if (!text) return '';
    
    // Convert common German special characters to ASCII equivalents
    let sanitized = text
      .replace(/ä/g, 'ae')
      .replace(/ö/g, 'oe')
      .replace(/ü/g, 'ue')
      .replace(/Ä/g, 'Ae')
      .replace(/Ö/g, 'Oe')
      .replace(/Ü/g, 'Ue')
      .replace(/ß/g, 'ss');
    
    // Convert common Arabic text patterns to transliteration
    sanitized = sanitized
      .replace(/[\u0600-\u06FF]/g, '') // Remove Arabic characters
      .replace(/[\u0750-\u077F]/g, '') // Remove Arabic supplement
      .replace(/[\u08A0-\u08FF]/g, '') // Remove Arabic extended
      .replace(/[\uFB50-\uFDFF]/g, '') // Remove Arabic presentation forms
      .replace(/[\uFE70-\uFEFF]/g, ''); // Remove Arabic presentation forms B
    
    // Remove other non-ASCII characters that might cause issues
    sanitized = sanitized.replace(/[^\x00-\x7F]/g, '');
    
    // Clean up extra spaces and trim
    return sanitized.replace(/\s+/g, ' ').trim();
  }
}