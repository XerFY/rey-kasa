import {
  FileSpreadsheet,
  FileText,
} from "lucide-react";

import "../styles/ReportExportActions.css";

import {
  exportReportCsv,
  openReportForPdf,
} from "../services/reportExportService";

import type { Transaction } from "../types/Transaction";

type Props = {
  transactions: Transaction[];
  title: string;
};

function ReportExportActions({
  transactions,
  title,
}: Props) {
  return (
    <div className="report-export-actions">
      <button
        type="button"
        className="report-export-pdf"
        onClick={() =>
          openReportForPdf({
            transactions,
            title,
          })
        }
        disabled={
          transactions.length === 0
        }
      >
        <FileText size={19} />
        PDF Oluştur
      </button>

      <button
        type="button"
        className="report-export-excel"
        onClick={() =>
          void exportReportCsv({
            transactions,
            title,
          })
        }
        disabled={
          transactions.length === 0
        }
      >
        <FileSpreadsheet size={19} />
        Excel / CSV
      </button>
    </div>
  );
}

export default ReportExportActions;