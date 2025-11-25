import * as pdfjsLib from 'pdfjs-dist';

// Set the worker source manually to ensure it loads correctly from CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs`;

export const extractTextFromPDF = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  
  // Load the PDF file
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  
  let fullText = '';

  // Iterate over all pages
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    
    // Extract text items and join them
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
      
    fullText += ` --- PÁGINA ${i} --- \n ${pageText} \n`;
  }

  return fullText;
};