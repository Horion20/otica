import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { SpectacleFrame } from "../types";

export const generateFramesPDF = (frames: SpectacleFrame[], title: string, category: 'inventory' | 'marketplace' | 'sold') => {
  const doc = new jsPDF();
  
  // Configurações visuais
  const primaryColor = [13, 148, 136]; // brand-600 (#0d9488)
  const slateColor = [30, 41, 59]; // slate-800

  // 1. Cabeçalho
  doc.setFontSize(22);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("GERENCIADOR COMERCIAL", 14, 20);

  // 2. Subtítulo / Título do Relatório
  doc.setFontSize(14);
  doc.setTextColor(slateColor[0], slateColor[1], slateColor[2]);
  doc.text(title.toUpperCase(), 14, 29);

  // 3. Data e Hora
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // slate-500
  const dateStr = new Date().toLocaleDateString('pt-BR') + ' às ' + new Date().toLocaleTimeString('pt-BR');
  doc.text(`Gerado em: ${dateStr}`, 14, 35);

  // 4. Totais
  const totalItems = frames.length;
  const totalValue = frames.reduce((acc, frame) => {
    return acc + (category === 'marketplace' ? frame.storePrice : frame.purchasePrice);
  }, 0);

  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text(`Itens Listados: ${totalItems}`, 14, 45);
  doc.text(`Valor Total Estimado: ${totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`, 14, 51);

  // 5. Preparar dados da tabela
  const tableColumn = ["Marca", "Modelo", "Cor", "Tamanho", "EAN", category === 'marketplace' ? "Venda" : "Custo", "Status"];
  const tableRows: any[] = [];

  frames.forEach(frame => {
    const frameData = [
      frame.brand,
      frame.modelCode,
      frame.colorCode || '-',
      frame.size || '-',
      frame.ean || '-',
      (category === 'marketplace' ? frame.storePrice : frame.purchasePrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      frame.isSold ? 'VENDIDO' : 'DISPONÍVEL'
    ];
    tableRows.push(frameData);
  });

  // 6. Gerar Tabela
  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 60,
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor as [number, number, number],
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center'
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
      valign: 'middle'
    },
    columnStyles: {
      0: { fontStyle: 'bold' }, // Marca
      5: { halign: 'right', fontStyle: 'bold' }, // Preço
      6: { halign: 'center' } // Status
    },
    didParseCell: (data: any) => {
        // Estilizar status vendido em vermelho
        if (data.column.index === 6 && data.cell.raw === 'VENDIDO') {
            data.cell.styles.textColor = [220, 38, 38];
            data.cell.styles.fontStyle = 'bold';
        }
    }
  });

  // Rodapé com paginação
  const pageCount = doc.getNumberOfPages();
  for(let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
  }

  return doc;
};