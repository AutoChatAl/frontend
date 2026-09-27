import { Fragment } from 'react';

interface RichTextProps {
  /** Texto com trechos em `**negrito**`. Tudo é renderizado como texto — nada vira HTML. */
  text: string;
}

export default function RichText({ text }: RichTextProps) {
  return (
    <>
      {text.split('**').map((part, index) =>
        index % 2 === 1
          ? <strong key={index} className="font-semibold">{part}</strong>
          : <Fragment key={index}>{part}</Fragment>,
      )}
    </>
  );
}
