import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { saveAs } from 'file-saver';
import { EmployeeInfo, Answer } from './types';
import { computeAll } from './scoring';

export async function exportDocx(
  templateFile: File | ArrayBuffer,
  employeeInfo: EmployeeInfo,
  answers: Answer[]
) {
  let arrayBuffer: ArrayBuffer;
  if (templateFile instanceof File) {
    arrayBuffer = await templateFile.arrayBuffer();
  } else {
    arrayBuffer = templateFile;
  }

  const zip = new PizZip(arrayBuffer);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: '{{', end: '}}' },
  });

  const results = computeAll(answers);

  // Build category score map
  const catMap: Record<string, number> = {};
  for (const cs of results.catScores) {
    catMap[cs.category] = cs.score;
  }

  const data: Record<string, string> = {
    EMPLOYEE_NAME: employeeInfo.employeeName,
    GROUP: employeeInfo.group,
    POSITION_TITLE: employeeInfo.positionTitle,
    DEPARTMENT: employeeInfo.department,
    DIVISION: employeeInfo.division,
    DATE_HIRED: employeeInfo.dateHired,
    PEF_PERIOD: employeeInfo.pefPeriod,
    EVAL_DISCUSSION_DATE: employeeInfo.evalDiscussionDate,

    FDR_SCORE: (catMap['FDR'] || 0).toFixed(2),
    RO_SCORE: (catMap['RO'] || 0).toFixed(2),
    SS_SCORE: (catMap['SS'] || 0).toFixed(2),
    IRR_SCORE: (catMap['IRR'] || 0).toFixed(2),
    DCT_SCORE: (catMap['DCT'] || 0).toFixed(2),
    CDQ_SCORE: (catMap['CDQ'] || 0).toFixed(2),
    TDA_SCORE: (catMap['TDA'] || 0).toFixed(2),
    TSD_SCORE: (catMap['TSD'] || 0).toFixed(2),
    TER_SCORE: (catMap['TER'] || 0).toFixed(2),
    KSI_SCORE: (catMap['KSI'] || 0).toFixed(2),

    PD_SCORE: (catMap['PD'] || 0).toFixed(2),
    RDM_SCORE: (catMap['RDM'] || 0).toFixed(2),
    CSF_SCORE: (catMap['CSF'] || 0).toFixed(2),
    CD_SCORE: (catMap['CD'] || 0).toFixed(2),
    LX_SCORE: (catMap['LX'] || 0).toFixed(2),
    IO_SCORE: (catMap['IO'] || 0).toFixed(2),
    CPS_SCORE: (catMap['CPS'] || 0).toFixed(2),

    KPI_RATING_FORMULA: results.kpiAvg.toFixed(2),
    KPI_WEIGHTED_FORMULA: results.kpiWeighted.toFixed(2),
    KPI_ACHIEVEMENT_LEVEL: results.kpiLevel,

    COMPETENCY_RATING_FORMULA: results.compAvg.toFixed(2),
    COMPETENCY_WEIGHTED_FORMULA: results.compWeighted.toFixed(2),
    COMPETENCY_LEVEL: results.compLevel,

    PERFORMANCE_OVERALL_SCORE: results.overall.toFixed(2),
    PERFORMANCE_LEVEL: results.overallLevel,

    FIRST_SEMI_ANNUAL_RATING: '',
    SEOND_SEMI_ANNUAL_RATING: '',
    ANNUAL_PERFORMANCE_LEVEL: '',
  };

  doc.render(data);

  const out = doc.getZip().generate({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
  saveAs(out, `Performance Evaluation - ${employeeInfo.employeeName}.docx`);
}
