import * as XLSX from 'xlsx';

export const extractTextFromExcel = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer);
  
  // Get the first sheet
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  
  // Convert sheet to CSV text
  // CSV is an excellent format for the AI to parse structure from
  const csvOutput = XLSX.utils.sheet_to_csv(sheet);
  
  return `--- CONTEÚDO DO ARQUIVO EXCEL/CSV ---\n${csvOutput}`;
};