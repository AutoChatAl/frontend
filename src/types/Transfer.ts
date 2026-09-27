/** Arquivo pronto para download, devolvido pelas rotas de exportação. */
export interface TransferExport {
  filename: string;
  csv: string;
}

/** Retorno de uma importação: o que entrou, o que ficou de fora e por quê. */
export interface TransferImportResult {
  imported: number;
  skipped: number;
  warnings: string[];
}
