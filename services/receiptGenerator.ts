import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import JsBarcode from "jsbarcode";
import { SpectacleFrame } from "../types";

export const generateReceiptPDF = (frame: SpectacleFrame) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  
  const buyer = frame.buyerInfo;
  
  // --- HEADER ---
  doc.setFontSize(22);
  doc.setTextColor(13, 148, 136); // Brand Color
  doc.text("OTIC", 14, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text("Gerenciador Comercial Óptico", 14, 25);
  doc.text("Recibo de Venda / Cupom Não Fiscal", 14, 30);

  doc.setFontSize(10);
  doc.setTextColor(0);
  const dateStr = frame.soldAt ? new Date(frame.soldAt).toLocaleString('pt-BR') : new Date().toLocaleString('pt-BR');
  doc.text(`Data: ${dateStr}`, pageWidth - 14, 20, { align: 'right' });
  doc.text(`Pedido Nº: #${frame.id.substring(0, 8).toUpperCase()}`, pageWidth - 14, 25, { align: 'right' });

  // --- SEPARATOR ---
  doc.setDrawColor(200);
  doc.line(14, 35, pageWidth - 14, 35);

  // --- CUSTOMER DETAILS ---
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("DADOS DO CLIENTE", 14, 45);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  if (buyer) {
      doc.text(`Nome: ${buyer.name || 'Consumidor Final'}`, 14, 52);
      doc.text(`CPF: ${buyer.cpf || '-'}`, 14, 57);
      doc.text(`Telefone: ${buyer.phone || '-'}`, pageWidth / 2, 57);
      
      const addressLine1 = `${buyer.street || ''}, ${buyer.number || ''} ${buyer.complement ? '- ' + buyer.complement : ''}`;
      const addressLine2 = `${buyer.neighborhood || ''} - ${buyer.city || ''} / ${buyer.state || ''} - CEP: ${buyer.cep || ''}`;
      
      doc.text(`Endereço: ${addressLine1}`, 14, 64);
      doc.text(addressLine2, 14, 69);
  } else {
      doc.text("Cliente não identificado", 14, 52);
  }

  // --- PRODUCT TABLE ---
  const tableData = [
      [
          frame.soldQuantity || 1,
          `${frame.brand} ${frame.modelCode} ${frame.colorCode ? '- ' + frame.colorCode : ''}`,
          (frame.storePrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
          ((frame.storePrice) * (frame.soldQuantity || 1)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      ]
  ];

  autoTable(doc, {
      startY: 80,
      head: [['Qtd', 'Descrição do Produto', 'Vlr. Unit.', 'Total']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59] },
      columnStyles: {
          0: { halign: 'center', cellWidth: 15 },
          2: { halign: 'right', cellWidth: 35 },
          3: { halign: 'right', cellWidth: 35 }
      }
  });

  // --- TOTALS ---
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  const totalVal = (frame.storePrice) * (frame.soldQuantity || 1);
  
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`TOTAL A PAGAR: ${totalVal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`, pageWidth - 14, finalY, { align: 'right' });

  // --- BARCODE GENERATION ---
  // Create a canvas element to generate barcode image
  const canvas = document.createElement("canvas");
  // Use EAN if available, otherwise fallback to ID (Shortened to fit code128 properly if needed, but ID is UUID)
  // For UUIDs, Code 128 is fine. For EAN, standard EAN13.
  const codeToScan = frame.ean && frame.ean.length > 8 ? frame.ean : frame.id.substring(0, 12); 
  
  try {
      JsBarcode(canvas, codeToScan, {
        format: frame.ean && (frame.ean.length === 12 || frame.ean.length === 13) ? "EAN13" : "CODE128",
        displayValue: true,
        lineColor: "#000",
        width: 2,
        height: 40,
        fontSize: 10
      });
      
      const barcodeImg = canvas.toDataURL("image/png");
      
      // Add to PDF at the bottom
      doc.addImage(barcodeImg, "PNG", (pageWidth / 2) - 30, finalY + 20, 60, 25);
      
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(150);
      doc.text("Código de Controle / EAN", pageWidth / 2, finalY + 48, { align: 'center' });

  } catch (err) {
      console.warn("Could not generate barcode", err);
  }

  // --- FOOTER ---
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text("Obrigado pela preferência!", pageWidth / 2, doc.internal.pageSize.height - 15, { align: 'center' });

  doc.save(`Recibo_Venda_${frame.modelCode}_${new Date().getTime()}.pdf`);
};