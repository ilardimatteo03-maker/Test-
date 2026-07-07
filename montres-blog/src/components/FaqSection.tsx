export function FaqSection({
  faq,
}: {
  faq: { question: string; answer: string }[];
}) {
  if (!faq?.length) return null;

  return (
    <section className="not-prose mt-16">
      <h2 className="font-serif text-3xl font-bold mb-8">Questions fréquentes</h2>
      <div className="border-t border-ink/15">
        {faq.map((item, index) => (
          <details key={index} className="group border-b border-ink/15 py-5">
            <summary className="cursor-pointer list-none flex items-center justify-between gap-4 font-serif text-lg font-medium">
              {item.question}
              <span className="text-gold text-xl transition-transform group-open:rotate-45 shrink-0">
                +
              </span>
            </summary>
            <p className="mt-3 text-ink/70 leading-relaxed max-w-2xl">
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
