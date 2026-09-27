'use client';
import { AlertTriangle, Download, Upload } from 'lucide-react';
import { useRef, useState, type ReactNode } from 'react';

import Button from '@/components/Button';
import Callout from '@/components/Callout';
import Modal from '@/components/Modal';
import type { TransferExport, TransferImportResult } from '@/types/Transfer';

interface ImportExportMenuProps {
    /** Plural e minúsculo, do jeito que entra no meio da frase: "fluxos", "auto-respostas". */
    resourceLabel: string;
    onExport: () => Promise<TransferExport>;
    onImport: (csv: string) => Promise<TransferImportResult>;
    /** Campo extra do modal — o seletor de canal das auto-respostas, por exemplo. */
    importExtra?: ReactNode;
    /** Trava o envio enquanto o campo extra não estiver resolvido. */
    importBlocked?: boolean;
    /** Chamado depois de uma importação com pelo menos um item — a tela recarrega. */
    onImported?: () => void;
    onError?: (message: string) => void;
    disabled?: boolean;
}

/**
 * Par de botões "Exportar" e "Importar" em CSV, compartilhado pelas telas de
 * fluxos, perfis de IA, auto-respostas e funil.
 *
 * O download não é um link direto para a API: a rota exige `Authorization`, e o
 * navegador não manda cabeçalho em navegação comum. Então o CSV chega pelo
 * corpo da resposta e vira arquivo aqui, com um Blob.
 */
export default function ImportExportMenu({
  resourceLabel,
  onExport,
  onImport,
  importExtra,
  importBlocked = false,
  onImported,
  onError,
  disabled = false,
}: ImportExportMenuProps) {
  const [exporting, setExporting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<TransferImportResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setExporting(true);
    try {
      const { filename, csv } = await onExport();
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      // Sem o revoke o blob fica na memória da aba até ela ser fechada.
      URL.revokeObjectURL(url);
    } catch (e) {
      onError?.(e instanceof Error ? e.message : `Não foi possível exportar ${resourceLabel}.`);
    } finally {
      setExporting(false);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setFile(null);
    setResult(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    setResult(null);
    try {
      const csv = await file.text();
      const imported = await onImport(csv);
      setResult(imported);
      if (imported.imported > 0) onImported?.();
    } catch (e) {
      onError?.(e instanceof Error ? e.message : `Não foi possível importar ${resourceLabel}.`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          icon={<Download size={14}/>}
          onClick={handleExport}
          loading={exporting}
          loadingText="Exportando..."
          disabled={disabled}
        >
          Exportar
        </Button>
        <Button
          variant="secondary"
          size="sm"
          icon={<Upload size={14}/>}
          onClick={() => setModalOpen(true)}
          disabled={disabled}
        >
          Importar
        </Button>
      </div>

      <Modal isOpen={modalOpen} onClose={closeModal} title={`Importar ${resourceLabel}`} size="md">
        <div className="space-y-4">
          <p className="text-[13px] text-slate-500 dark:text-slate-400">
            Escolha um arquivo CSV exportado do Synq. O que já existe aqui é mantido — o
            conteúdo do arquivo entra como novo.
          </p>

          {importExtra}

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
              Arquivo CSV
            </label>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => {
                setFile(event.target.files?.[0] ?? null);
                setResult(null);
              }}
              disabled={importing}
              className="block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 file:mr-3 file:cursor-pointer file:border-0 file:bg-slate-100 dark:file:bg-slate-700 file:px-3 file:py-2 file:text-xs file:font-medium file:text-slate-700 dark:file:text-slate-200 disabled:opacity-60"
            />
          </div>

          {result && (
            <div className="space-y-2">
              <Callout tone={result.imported > 0 ? 'success' : 'warning'}>
                {result.imported > 0
                  ? `${result.imported} item(ns) importado(s).`
                  : 'Nada foi importado.'}
                {result.skipped > 0 && ` ${result.skipped} ficaram de fora.`}
              </Callout>

              {result.warnings.length > 0 && (
                <ul className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                  {result.warnings.map((warning, index) => (
                    <li key={index} className="flex gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <AlertTriangle size={12} className="mt-0.5 shrink-0 text-amber-500"/>
                      <span>{warning}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={closeModal}>
              {result ? 'Fechar' : 'Cancelar'}
            </Button>
            <Button
              size="sm"
              icon={<Upload size={14}/>}
              onClick={handleImport}
              loading={importing}
              loadingText="Importando..."
              disabled={!file || importBlocked}
            >
              Importar
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
