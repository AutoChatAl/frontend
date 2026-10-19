import { ImageResponse } from 'next/og';

export const alt = 'Você ganhou 5% de desconto no Synq';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * Prévia do link de indicação no WhatsApp e nas redes. O Satori só aceita estilo inline —
 * cores da marca do DESIGN_SYSTEM.md (indigo-600 #4f46e5, violet-600 #7c3aed).
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ fontSize: 34, fontWeight: 700, opacity: 0.9 }}>Synq</div>
        <div style={{ marginTop: 28, fontSize: 76, fontWeight: 800, lineHeight: 1.05, maxWidth: 900 }}>
          Você ganhou 5% de desconto
        </div>
        <div style={{ marginTop: 24, fontSize: 34, lineHeight: 1.35, maxWidth: 860, opacity: 0.9 }}>
          Teste grátis por 7 dias. Atendimento com IA no WhatsApp e no Instagram.
        </div>
        <div
          style={{
            marginTop: 44,
            display: 'flex',
            alignSelf: 'flex-start',
            padding: '16px 32px',
            borderRadius: 16,
            background: '#ffffff',
            color: '#4338ca',
            fontSize: 30,
            fontWeight: 700,
          }}
        >
          Aceitar o convite
        </div>
      </div>
    ),
    size,
  );
}
