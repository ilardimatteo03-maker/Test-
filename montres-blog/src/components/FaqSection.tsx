export function FaqSection({
  faq,
}: {
  faq: { question: string; answer: string }[];
}) {
  if (!faq?.length) return null;

  return (
    <section className="not-prose mt-14">
      <h2 className="font-serif text-2xl font-semibold mb-6">Questions fréquentes</h2>
      <div className="divide-y divide-ink/10 border-t border-b border-ink/10">
        {faq.map((item, index) => (
          <details key={index} className="group py-4">
            <summary className="cursor-pointer list-none flex items-center justify-between font-medium">
              {item.question}
              <span className="ml-4 text-ink/40 transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-3 text-ink/70 text-sm leading-relaxed">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
