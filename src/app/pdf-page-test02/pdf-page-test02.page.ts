
// src/app/pages/pdf-preview/pdf-preview.page.ts
import { Component, ViewChild, ElementRef,OnInit } from '@angular/core';
import { PDFDocument } from 'pdf-lib';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Platform } from '@ionic/angular';

@Component({
  selector: 'app-pdf-page-test02',
  templateUrl: './pdf-page-test02.page.html',
  styleUrls: ['./pdf-page-test02.page.scss'],
  standalone: false
})
export class PdfPageTest02Page {
  @ViewChild('pdfContainer', { static: true }) pdfContainer!: ElementRef<HTMLDivElement>;
  private pdfBytes!: Uint8Array;

  constructor(private platform: Platform) {}

  async generatePdf() {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([400, 200]);
    page.drawText('Hello from Ionic + PDF-Lib!', { x: 50, y: 100 });

    this.pdfBytes = await pdfDoc.save();
  }

  async previewPdf() {
    await this.generatePdf();

    if (this.platform.is('hybrid')) {
      // On mobile: Save file locally and open in webview/pdf.js
      const base64Data = this.arrayBufferToBase64(this.pdfBytes);
      await Filesystem.writeFile({
        path: 'sample.pdf',
        data: base64Data,
        directory: Directory.Cache,
      });

      const fileUri = await Filesystem.getUri({
        path: 'sample.pdf',
        directory: Directory.Cache,
      });

      // Use embed to preview inside div
      const embed = document.createElement('embed');
      embed.src = fileUri.uri;
      embed.type = 'application/pdf';
      embed.width = '100%';
      embed.height = '100%';
      this.pdfContainer.nativeElement.innerHTML = '';
      this.pdfContainer.nativeElement.appendChild(embed);
    } else {
      // Browser: Show via data URI
      const pdfDataUri = await (await PDFDocument.load(this.pdfBytes)).saveAsBase64({ dataUri: true });
      const embed = document.createElement('embed');
      embed.src = pdfDataUri;
      embed.type = 'application/pdf';
      embed.width = '100%';
      embed.height = '100%';
      this.pdfContainer.nativeElement.innerHTML = '';
      this.pdfContainer.nativeElement.appendChild(embed);
    }
  }

  private arrayBufferToBase64(buffer: Uint8Array) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}