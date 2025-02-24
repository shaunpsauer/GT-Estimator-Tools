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

export const parseExcelFile = async (file: File): Promise<Project[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Get all data including headers
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        // Filter out header rows by checking if the row looks like a header
        const filteredData = jsonData.filter((row: any) => {
          // Skip rows that contain column headers or are empty
          return !(
            row['Construction Milestones'] === 'NTP' || // First header row
            row['__EMPTY'] === 'Row' || // Second header row
            !row['__EMPTY_1'] // Empty rows
          );
        });

        const projects: Project[] = filteredData.map((row: any, index) => ({
          id: index + 1,
          costEstimator: row['__EMPTY_1'] || '',
          costEstimatorRequest: row['__EMPTY_2'] || '',
          ade: row['__EMPTY_3'] || '',
          projectManager: row['__EMPTY_4'] || '',
          projectEngineer: row['__EMPTY_5'] || '',
          designEstimator: row['__EMPTY_6'] || '',
          constructionContractor: row['__EMPTY_7'] || '',
          bundleId: row['__EMPTY_8'] || '',
          postEstimate: row['__EMPTY_9'] || '',
          pmoId: row['__EMPTY_10'] || '',
          order: row['__EMPTY_11'] || '',
          multipleOrder: row['__EMPTY_12'] || '',
          mat: row['__EMPTY_13'] || '',
          projectName: row['__EMPTY_14'] || '',
          workStream: row['__EMPTY_15'] || '',
          workType: row['__EMPTY_16'] || '',
          engrPlanYear: row['__EMPTY_17'] || '',
          constructionPlanYear: row['__EMPTY_18'] || '',
          commitmentDate: formatExcelDate(row['__EMPTY_19']),
          station: row['__EMPTY_20'] || '',
          line: row['__EMPTY_21'] || '',
          mp1: row['__EMPTY_22'] || '',
          mp2: row['__EMPTY_23'] || '',
          city: row['__EMPTY_24'] || '',
          county: row['__EMPTY_25'] || '',
          class5: formatExcelDate(row['Estimating Milestone']),
          class4: formatExcelDate(row['__EMPTY_27']),
          class3: formatExcelDate(row['__EMPTY_28']),
          class2: formatExcelDate(row['__EMPTY_29']),
          negotiatePrice: formatExcelDate(row['__EMPTY_30']),
          jeReadyToRoute: formatExcelDate(row['__EMPTY_31']),
          jeApproved: formatExcelDate(row['__EMPTY_32']),
          estimateAnalysis: formatExcelDate(row['__EMPTY_33']),
          // Only keep the percentage-based names
          thirtyPercentDesignAvailable: formatExcelDate(row['__EMPTY_34']),
          sixtyPercentDesignReviewMeeting: formatExcelDate(row['__EMPTY_35']),
          sixtyPercentDesignAvailable: formatExcelDate(row['__EMPTY_36']),
          ninetyPercentDesignReviewMeeting: formatExcelDate(row['__EMPTY_37']),
          ninetyPercentDesignAvailable: formatExcelDate(row['__EMPTY_38']),
          ifc: formatExcelDate(row['__EMPTY_39']),
          ntp: formatExcelDate(row['Construction Milestones']),
          mob: formatExcelDate(row['__EMPTY_40']),
          tieIn: formatExcelDate(row['__EMPTY_41']),
          enro: formatExcelDate(row['__EMPTY_42']),
          unitCapture: formatExcelDate(row['__EMPTY_43']),
        }));

        resolve(projects);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
}; 