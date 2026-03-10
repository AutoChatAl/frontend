'use client';

import { MessageCircle } from 'lucide-react';
import { useState } from 'react';

import AddChannelCard from './AddChannelCard';
import ChannelInstanceCard from './ChannelInstanceCard';
import WhatsAppCreateModal from './WhatsAppCreateModal';
import WhatsAppQRModal from './WhatsAppQRModal';

import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import { ToastContainer, useToast } from '@/components/Toast';
import { useChannelStatus } from '@/contexts/ChannelStatusContext';
import { useWhatsAppInstances } from '@/hooks/ChannelHook';

export default function WhatsAppInstances() {
  const { instances, loading, createInstance, connectInstance, getQRCode, getStatus, deleteInstance, refetch } = useWhatsAppInstances();
  const { refetchWhatsApp } = useChannelStatus();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { toasts, addToast, removeToast } = useToast();

  const handleOpenCreateModal = () => {
    setShowCreateModal(true);
  };

  const handleRefresh = async (id: string | number) => {
    try {
      await getStatus(String(id));
      await refetch();
      await refetchWhatsApp();
    } catch (_error) {
      // Handle error silently
    }
  };

  const handleDeleteClick = (id: string | number) => {
    setDeleteTarget(String(id));
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteInstance(deleteTarget);
      await refetchWhatsApp();
      addToast('success', 'Instância deletada com sucesso.');
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : 'Erro ao deletar instância.');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  if (loading && instances.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AddChannelCard
          title="Nova Instância"
          subtitle="Escanear QR Code"
          colorClass="emerald"
          onClick={handleOpenCreateModal}
        />

        {instances.map((inst) => (
          <ChannelInstanceCard
            key={inst.id}
            id={inst.id}
            icon={
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <MessageCircle size={24} />
              </div>
            }
            title={inst.name}
            subtitle={inst.number || 'Não conectado'}
            status={inst.status === 'CONNECTED' ? 'connected' : 'disconnected'}
            colorClass="emerald"
            onRefresh={handleRefresh}
            onDelete={handleDeleteClick}
          />
        ))}
      </div>

      {showCreateModal && (
        <WhatsAppCreateModal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            refetch();
            refetchWhatsApp();
          }}
          onCreate={createInstance}
          onConnect={connectInstance}
        />
      )}

      {showQRModal && selectedChannelId && (
        <WhatsAppQRModal
          isOpen={showQRModal}
          onClose={() => {
            setShowQRModal(false);
            setSelectedChannelId(null);
            refetch();
            refetchWhatsApp();
          }}
          channelId={selectedChannelId}
          onGetQRCode={getQRCode}
          onCheckStatus={getStatus}
        />
      )}

      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        message="Tem certeza que deseja deletar esta instância do WhatsApp? Esta ação não pode ser desfeita."
        loading={deleting}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}
