/**
 * Contato de WhatsApp do site. Fica num módulo só porque o botão flutuante e os
 * links dentro das seções precisam apontar para o mesmo número — trocar o
 * atendimento em um lugar e esquecer do outro é o tipo de divergência que só
 * aparece quando o cliente já mandou mensagem para o número errado.
 */
export const WHATSAPP_NUMBER = '5533999865046';

export function whatsappHref(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
