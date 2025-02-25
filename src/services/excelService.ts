import { Project } from '../types/Project';
import * as XLSX from 'xlsx';

const formatExcelDate = (excelDate: any): string => {
  if (!excelDate) return '';
  
  // If it's already a string in date format, return it
  if (typeof excelDate === 'string' && excelDate.includes('/')) {
    return excelDate;
  }

  try {
    // Convert Excel date number to JS date
    const date = new Date((excelDate - 25569) * 86400 * 1000);
    
    // Format as MM/DD/YYYY
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${month}/${day}/${year}`;
  } catch (error) {
    return excelDate?.toString() || '';
  }
};

function hashProjectIdentifiers(pmoId: string, order: string, fallbackIndex: number): number {
  if (!pmoId && !order) {
    return fallbackIndex + 1;
  }
  
  const str = `${pmoId}-${order}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return Math.abs(hash) || (fallbackIndex + 1);
}

export const parseExcelFile = async (file: File): Promise<Project[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });

        const sheetName = "Estimating Schedule";
        if (!workbook.SheetNames.includes(sheetName)) {
          reject(`Sheet "${sheetName} not found in Excel file.`);
          return;
        }

        const worksheet = workbook.Sheets[sheetName];
        const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header:1 });
        if (rawData.length < 4) {
          reject("Excel file does not contain enough rows.");
          return;
        }

        const headers: string[] = rawData[3].slice(1);
        const jsonData = rawData.slice(4);
        const formattedData = jsonData.map((row: any[]) => {
          const rowData: any = {};
          headers.forEach((header, index) => {
            rowData[header] = row[index + 1] || '';
          });
          return rowData;
        });

        const projects: Project[] = formattedData.map((row: any, index) => {
          const pmoId = row["PMO ID"] || '';
          const order = row["Order"] || '';
          const uniqueId = hashProjectIdentifiers(pmoId, order, index);

          return {
            id: uniqueId,
            pmoId,
            order,
            costEstimator: row["Cost Estimator"] || '',
            costEstimatorRequest: row["Cost Estimator Requested"] || '',
            ade: row["ADE"] || '',
            projectManager: row["Project Manager"] || '',
            projectEngineer: row["Project Engineer"] || '',
            designEstimator: row["Design Estimator"] || '',
            constructionContractor: row["Construction Contractor"] || '',
            bundleId: row["Bundle ID"] || '',
            postEstimate: row["Post Estimate"] || '',
            multipleOrder: row["Multiple Order"] || '',
            mat: row["MAT"] || '',
            projectName: row["Project Name"] || '',
            workStream: row["Work Stream"] || '',
            workType: row["Work Type"] || '',
            engrPlanYear: row["Engr Plan Year"] ? Number(row["Engr Plan Year"]) : 0,
            constPlanYear: row["Construction Plan Year"] ? Number(row["Construction Plan Year"]) : 0,
            commitmentDate: formatExcelDate(row["Commitment Date"]),
            station: row["Station"] || '',
            line: row["Line"] || '',
            mp1: row["MP1"] || '',
            mp2: row["MP2"] || '',
            city: row["City"] || '',
            county: row["County"] || '',
            class5: formatExcelDate(row["Class 5"]),
            class4: formatExcelDate(row["Class 4"]),
            class3: formatExcelDate(row["Class 3"]),
            class2: formatExcelDate(row["Class 2"]),
            negotiatePrice: formatExcelDate(row["Negotiate Price"]),
            jeReadyToRoute: formatExcelDate(row["JE Ready to Route"]),
            jeApproved: formatExcelDate(row["JE Approved"]),
            estimateAnalysis: formatExcelDate(row["Estimate Analysis"]),
            // Only keep the percentage-based names
            thirtyPercentDesignReviewMeeting: formatExcelDate(row["30% Design Review Meeting"]),
            thirtyPercentDesignAvailable: formatExcelDate(row["30% Design Available"]),
            sixtyPercentDesignReviewMeeting: formatExcelDate(row["60% Design Review Meeting"]),
            sixtyPercentDesignAvailable: formatExcelDate(row["60% Design Available"]),
            ninetyPercentDesignReviewMeeting: formatExcelDate(row["90% Design Review Meeting"]),
            ninetyPercentDesignAvailable: formatExcelDate(row["90% Design Available"]),
            ifc: formatExcelDate(row["IFC"]),
            ntp: formatExcelDate(row["NTP"]),
            mob: formatExcelDate(row["MOB"]),
            tieIn: formatExcelDate(row["Tie-In"]),
            edro: formatExcelDate(row["EDRO"]),
            unitCapture: formatExcelDate(row["Unit Capture"]),
          };
        });

        resolve(projects);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
}; 