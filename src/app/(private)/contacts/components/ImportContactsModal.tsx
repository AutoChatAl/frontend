'use client';
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, Loader2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';

import Modal from '@/components/Modal';
import type { ContactImportReport } from '@/types/Contact';

interface ImportContactsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (file: File) => Promise<ContactImportReport>;
    onSuccess: (report: ContactImportReport) => void;
}
const ACCEPTED_EXTENSIONS = ['.xlsx', '.xlsm', '.csv'];
const TEMPLATE_ROWS = [
  ['Nome', 'Telefone'],
  ['Maria Souza', '(11) 98888-7777'],
  ['João Lima', '11987654321'],
  ['', '+55 33 98853-1797'],
];
const ISSUE_LABELS: Record<string, string> = {
  MISSING_PHONE: 'Linha sem telefone',
  INVALID_PHONE: 'Telefone inválido',
  DUPLICATE_IN_FILE: 'Telefone repetido na planilha',
  PLAN_LIMIT_REACHED: 'Limite de contatos do plano atingido',
};
function downloadTemplate() {
  const csv = TEMPLATE_ROWS.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(';')).join('\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'modelo-contatos-synq.csv';
  anchor.click();
  URL.revokeObjectURL(url);
}
export default function ImportContactsModal({ isOpen, onClose, onImport, onSuccess }: ImportContactsModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [report, setReport] = useState<ContactImportReport | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleClose = () => {
    if (loading)
      return;
    setFile(null);
    setError('');
    setReport(null);
    setDragging(false);
    onClose();
  };
  const selectFile = (selected: File | null | undefined) => {
    setError('');
    setReport(null);
    if (!selected)
      return;
    if (!ACCEPTED_EXTENSIONS.some((extension) => selected.name.toLowerCase().endsWith(extension))) {
      setError('Formato não aceito. Envie um arquivo .xlsx, .xlsm ou .csv.');
      return;
    }
    setFile(selected);
  };
  const handleSubmit = async () => {
    if (!file)
      return;
    setLoading(true);
    setError('');
    try {
      const result = await onImport(file);
      setReport(result);
      onSuccess(result);
    }
    catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível importar a planilha.');
    }
    finally {
      setLoading(false);
    }
  };
  return (<Modal isOpen={isOpen} onClose={handleClose} title="Importar contatos por planilha" size="md">
    {report ? (<div className="space-y-4">
      <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800">
        <CheckCircle2 size={22} className="text-emerald-600 dark:text-emerald-400 shrink-0"/>
        <p className="text-sm text-emerald-800 dark:text-emerald-300">
            Importação concluída. Sua base agora tem {report.totalAfterImport.toLocaleString('pt-BR')} contatos.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryTile label="Criados" value={report.created}/>
        <SummaryTile label="Atualizados" value={report.updated}/>
        <SummaryTile label="Ignorados" value={report.skipped + report.duplicatesInFile}/>
        <SummaryTile label="Fora do limite" value={report.ignoredByLimit}/>
      </div>

      <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
        <p>Colunas reconhecidas:</p>
        <ul className="space-y-0.5">
          <li>Telefone: {report.detectedColumns.phone ?? 'não encontrada'}</li>
          <li>Nome: {report.detectedColumns.name ?? 'não encontrada'}</li>
        </ul>
      </div>

      {report.issues.length > 0 && (<div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-3 max-h-48 overflow-y-auto">
        <p className="text-xs font-medium text-amber-800 dark:text-amber-300 flex items-center gap-1.5 mb-2">
          <AlertTriangle size={14}/>
            Avisos ({report.issues.length})
        </p>
        <ul className="space-y-1">
          {report.issues.map((issue, index) => (<li key={`${issue.line}-${issue.reason}-${index}`} className="text-xs text-amber-700 dark:text-amber-400">
            {issue.line > 0 ? `Linha ${issue.line}: ` : ''}{ISSUE_LABELS[issue.reason] ?? issue.reason}{issue.value ? ` (${issue.value})` : ''}
          </li>))}
        </ul>
      </div>)}

      <div className="flex justify-end">
        <button type="button" onClick={handleClose} className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all hover:scale-105 active:scale-95">
            Fechar
        </button>
      </div>
    </div>) : (<div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-400">
          Envie uma planilha com uma coluna de <strong>telefone</strong> — é a única obrigatória. Se houver coluna de <strong>nome</strong>, ela é usada; colunas extras são ignoradas.
      </p>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3 text-xs text-slate-600 dark:text-slate-400 space-y-1">
        <p>Os contatos importados <strong>não ficam ligados a nenhum canal</strong>: entram na sua base e podem ser usados em campanhas do WhatsApp Oficial.</p>
        <p>Eles entram <strong>com opt-in de marketing</strong>, para receberem qualquer categoria de template — inclusive marketing. Só importe quem já autorizou receber suas mensagens: o consentimento é responsabilidade sua, e denúncias derrubam a qualidade do seu número na Meta.</p>
      </div>

      <div onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(e) => { e.preventDefault(); setDragging(false); selectFile(e.dataTransfer.files[0]); }} onClick={() => fileInputRef.current?.click()} className={`rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${dragging ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700'}`}>
        <input ref={fileInputRef} type="file" accept=".xlsx,.xlsm,.csv" className="hidden" onChange={(e) => selectFile(e.target.files?.[0])}/>
        <FileSpreadsheet size={28} className="mx-auto text-slate-300 dark:text-slate-600"/>
        <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-300">
          {file ? file.name : 'Arraste a planilha aqui ou clique para escolher'}
        </p>
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">.xlsx, .xlsm ou .csv · até 6 MB</p>
      </div>

      {error && (<p className="text-xs text-red-500 flex items-center gap-1">
        <AlertTriangle size={12}/>
        {error}
      </p>)}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
        <button type="button" onClick={downloadTemplate} className="flex items-center gap-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
          <Download size={14}/>
            Baixar planilha modelo
        </button>
        <div className="flex gap-3">
          <button type="button" onClick={handleClose} disabled={loading} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors disabled:opacity-50">
              Cancelar
          </button>
          <button type="button" onClick={handleSubmit} disabled={!file || loading} className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 disabled:hover:scale-100">
            {loading ? <Loader2 size={16} className="animate-spin"/> : <Upload size={16}/>}
            {loading ? 'Importando...' : 'Importar'}
          </button>
        </div>
      </div>
    </div>)}
  </Modal>);
}
function SummaryTile({ label, value }: { label: string; value: number }) {
  return (<div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 p-3 text-center">
    <p className="text-lg font-bold text-slate-800 dark:text-white">{value.toLocaleString('pt-BR')}</p>
    <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
  </div>);
}
