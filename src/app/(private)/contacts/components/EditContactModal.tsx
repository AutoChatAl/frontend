/* eslint-disable no-console */
'use client';

import { AlertCircle, Check, Loader2, Plus, Save, Tag, Trash2, X } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

import Modal from '@/components/Modal';
import { contactService } from '@/services/contact.service';
import { tagService, type Tag as TagType } from '@/services/tag.service';
import type { Contact } from '@/types/Contact';

interface EditContactModalProps {
  isOpen: boolean;
  contact: Contact | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditContactModal({ isOpen, contact, onClose, onSuccess }: EditContactModalProps) {
  const [loading, setLoading] = useState(false);
  const [loadingTags, setLoadingTags] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [allTags, setAllTags] = useState<TagType[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [creatingTag, setCreatingTag] = useState(false);
  const [showNewTagInput, setShowNewTagInput] = useState(false);

  const loadTags = useCallback(async () => {
    try {
      setLoadingTags(true);
      const tags = await tagService.listTags();
      setAllTags(tags);
    } catch (err) {
      console.error('Erro ao carregar tags:', err);
    } finally {
      setLoadingTags(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && contact) {
      loadTags();
      setDisplayName(contact.displayName || '');
      setSelectedTagId(contact.tags?.[0]?.tagId ?? null);
      setError(null);
      setNewTagName('');
      setShowNewTagInput(false);
    }
  }, [isOpen, contact, loadTags]);

  const handleSave = async () => {
    if (!contact) return;
    try {
      setLoading(true);
      setError(null);
      await contactService.updateContact(contact.id, {
        displayName: displayName.trim() || undefined,
        tagIds: selectedTagId ? [selectedTagId] : [],
      });
      onSuccess();
      handleClose();
    } catch (err) {
      console.error('Erro ao atualizar contato:', err);
      setError(err instanceof Error ? err.message : 'Erro ao atualizar contato.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTag = async () => {
    const name = newTagName.trim();
    if (!name) return;
    try {
      setCreatingTag(true);
      const tag = await tagService.createTag(name);
      setAllTags((prev) => [...prev, tag]);
      setSelectedTagId(tag.id);
      setNewTagName('');
      setShowNewTagInput(false);
    } catch (err) {
      console.error('Erro ao criar tag:', err);
      setError(err instanceof Error ? err.message : 'Erro ao criar tag.');
    } finally {
      setCreatingTag(false);
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    try {
      await tagService.deleteTag(tagId);
      setAllTags((prev) => prev.filter((t) => t.id !== tagId));
      if (selectedTagId === tagId) setSelectedTagId(null);
    } catch (err) {
      console.error('Erro ao excluir tag:', err);
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTagId((prev) => (prev === tagId ? null : tagId));
  };

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  const identities = contact?.identities ?? [];
  const identifier = identities.length > 0
    ? (identities[0]?.phoneE164 || identities[0]?.igUsername || '—')
    : '';

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Editar Contato" size="md">
      {loadingTags ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Loader2 className="animate-spin text-indigo-500" size={24} />
          <p className="text-slate-500 dark:text-slate-400 text-sm">Carregando...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {error && (
            <div className="flex items-start gap-3 p-3.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-400 flex-1">{error}</p>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 shrink-0">
                <X size={15} />
              </button>
            </div>
          )}

          <section>
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
              Informações
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Nome
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 bg-white dark:bg-slate-900 dark:text-white transition-colors placeholder:text-slate-400"
                  placeholder="Nome do contato"
                />
              </div>
              {identifier && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Identificador
                  </label>
                  <p className="px-4 py-2.5 text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl font-mono">
                    {identifier}
                  </p>
                </div>
              )}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Tag size={14} />
                Tags
              </h3>
              {selectedTagId && (
                <span className="text-xs bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full font-medium">
                  1 selecionada
                </span>
              )}
            </div>

            {allTags.length === 0 && !showNewTagInput ? (
              <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl gap-2">
                <Tag size={20} className="text-slate-300 dark:text-slate-600" />
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                  Nenhuma tag criada ainda
                </p>
                <button
                  type="button"
                  onClick={() => setShowNewTagInput(true)}
                  className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium flex items-center gap-1 mt-1"
                >
                  <Plus size={14} />
                  Criar primeira tag
                </button>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap gap-2 mb-3">
                  {allTags.map((tag) => {
                    const isSelected = selectedTagId === tag.id;
                    return (
                      <div key={tag.id} className="group flex items-center">
                        <button
                          type="button"
                          onClick={() => toggleTag(tag.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-l-lg text-sm font-medium border-2 transition-all ${isSelected
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                          }`}
                        >
                          {isSelected && <Check size={13} className="text-indigo-500" />}
                          {tag.name}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTag(tag.id)}
                          className={`px-1.5 py-1.5 border-2 border-l-0 rounded-r-lg transition-all opacity-0 group-hover:opacity-100 ${isSelected
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30'
                          }`}
                          title="Excluir tag"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {!showNewTagInput ? (
                  <button
                    type="button"
                    onClick={() => setShowNewTagInput(true)}
                    className="flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors"
                  >
                    <Plus size={14} />
                    Nova tag
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreateTag();
                        if (e.key === 'Escape') {
                          setShowNewTagInput(false);
                          setNewTagName('');
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 bg-white dark:bg-slate-900 dark:text-white text-sm placeholder:text-slate-400"
                      placeholder="Nome da tag..."
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleCreateTag}
                      disabled={!newTagName.trim() || creatingTag}
                      className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      {creatingTag ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                      Criar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewTagInput(false);
                        setNewTagName('');
                      }}
                      className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </>
            )}
          </section>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="sm:mr-auto px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-indigo-500/25"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
