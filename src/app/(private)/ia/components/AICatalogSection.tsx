'use client';
import { Trash2, Upload } from 'lucide-react';
import { useEffect, useRef } from 'react';

import Button from '@/components/Button';
import Card from '@/components/Card';
import SectionHeader from '@/components/SectionHeader';
import ToggleRow from '@/components/ToggleRow';
import type { AiCatalogScope, InstagramProductLayout, Product, ProductPayload } from '@/types/AI';

import AIProductsInput from './AIProductsInput';

const LAYOUT_OPTIONS: Array<{ value: InstagramProductLayout; label: string; hint: string }> = [
  { value: 'QUICK_REPLY', label: 'Botões de resposta', hint: 'Sem foto e nome curto, mas tocar envia o texto do botão como mensagem do cliente.' },
  { value: 'CAROUSEL', label: 'Carrossel com foto', hint: 'Foto, nome e preço em cada card. Exige imagem em todos os itens ativos.' },
];

interface AICatalogSectionProps {
    products: Product[];
    productsTotal: number;
    maxProducts: number;
    productsLoading: boolean;
    productSearch: string;
    productPage: number;
    productsPageSize: number;
    onProductSearchChange: (value: string) => void;
    onProductPageChange: (page: number) => void;
    onAddProduct: (name: string) => void;
    onUpdateProduct: (id: string, data: ProductPayload) => void;
    onDeleteProduct: (id: string) => void;
    onOpenImport: () => void;
    onClearCatalog: () => void;
    crossSellEnabled: boolean;
    onToggleCrossSell: (enabled: boolean) => void;
    productLayout: InstagramProductLayout;
    onProductLayoutChange: (layout: InstagramProductLayout) => void;
    onUploadProductImage: (id: string, file: File) => void;
    onRemoveProductImage: (id: string) => void;
    /** Quantos perfis o usuário tem — com um só, separar catálogo não faz sentido. */
    profileCount: number;
    catalogScope: AiCatalogScope;
    onCatalogScopeChange: (scope: AiCatalogScope) => void;
}

/**
 * Aba própria desde o redesign. O que a IA pode citar fica no primeiro card;
 * como ela oferece isso ao cliente, no segundo — são decisões diferentes.
 */
export default function AICatalogSection({ products, productsTotal, maxProducts, productsLoading, productSearch, productPage, productsPageSize, onProductSearchChange, onProductPageChange, onAddProduct, onUpdateProduct, onDeleteProduct, onOpenImport, onClearCatalog, crossSellEnabled, onToggleCrossSell, productLayout, onProductLayoutChange, onUploadProductImage, onRemoveProductImage, profileCount, catalogScope, onCatalogScopeChange }: AICatalogSectionProps) {
  // O GET /config semeia 50 itens de prévia, mas a paginação é de 20 — sem recarregar,
  // a primeira tela mostra mais itens do que o rodapé promete.
  const reloadedRef = useRef(false);
  useEffect(() => {
    if (reloadedRef.current) {
      return;
    }
    reloadedRef.current = true;
    onProductPageChange(1);
  }, [onProductPageChange]);
  return (
    <div className="space-y-3">
      <Card className="p-4">
        <SectionHeader
          title="Catálogo de produtos e serviços"
          hint="O que a IA pode citar, recomendar e enviar durante a conversa. Cada edição é salva na hora."
          action={<>
            <Button variant="secondary" size="sm" icon={<Upload size={14}/>} onClick={onOpenImport} className="flex-1 justify-center py-2 sm:flex-none sm:py-1.5">
                Importar planilha
            </Button>
            {productsTotal > 0 && (
              <Button variant="danger" size="sm" icon={<Trash2 size={14}/>} onClick={onClearCatalog} className="shrink-0 justify-center py-2 sm:py-1.5">
                  Limpar
              </Button>
            )}
          </>}
        />
        {profileCount > 1 && (
          <div className="mb-3 border-b border-slate-100 pb-3 dark:border-slate-700/60">
            <ToggleRow
              title="Catálogo separado por perfil"
              description="Ligado, cada perfil enxerga só os itens cadastrados nele — os que já existiam ficam com o primeiro perfil. Desligado, todos os perfis oferecem o mesmo catálogo."
              checked={catalogScope === 'profile'}
              onChange={(checked) => onCatalogScopeChange(checked ? 'profile' : 'shared')}
            />
          </div>
        )}

        <AIProductsInput
          products={products}
          total={productsTotal}
          maxProducts={maxProducts}
          loading={productsLoading}
          search={productSearch}
          page={productPage}
          pageSize={productsPageSize}
          onSearchChange={onProductSearchChange}
          onPageChange={onProductPageChange}
          onAddProduct={onAddProduct}
          onUpdateProduct={onUpdateProduct}
          onDeleteProduct={onDeleteProduct}
          onUploadImage={onUploadProductImage}
          onRemoveImage={onRemoveProductImage}
        />
      </Card>

      <Card className="p-4">
        <SectionHeader
          title="Como a IA oferece os itens"
          hint="Vale para as duas pontas: o que ela sugere por conta própria e o formato da lista enviada no chat."
        />

        <ToggleRow
          title="Sugerir itens complementares"
          description="Cross-sell: depois de recomendar um item, a IA propõe outro que costuma acompanhar."
          checked={crossSellEnabled}
          onChange={onToggleCrossSell}
        />

        <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-700/60">
          <p className="text-[13px] font-semibold text-slate-900 dark:text-white">Formato das opções no Instagram</p>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            Só afeta o Instagram. No WhatsApp os itens sempre vão como lista de botões.
          </p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {LAYOUT_OPTIONS.map((option) => {
              const selected = productLayout === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onProductLayoutChange(option.value)}
                  aria-pressed={selected}
                  className={`rounded-lg border px-3 py-2 text-left transition-colors ${
                    selected
                      ? 'border-indigo-300 bg-indigo-50 dark:border-indigo-500/40 dark:bg-indigo-500/10'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:border-slate-600 dark:hover:bg-slate-700/30'
                  }`}
                >
                  <span className={`block text-[13px] font-semibold ${selected ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-900 dark:text-white'}`}>
                    {option.label}
                  </span>
                  <span className="mt-0.5 block text-xs leading-snug text-slate-500 dark:text-slate-400">{option.hint}</span>
                </button>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
}
