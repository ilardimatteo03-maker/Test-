export function AffiliateButton({
  href,
  label = "Voir le prix sur Amazon",
}: {
  href: string;
  label?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="nofollow sponsored noopener"
      className="inline-flex items-center justify-center border border-ink bg-ink px-5 py-2.5 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-paper hover:bg-gold hover:border-gold hover:text-ink transition-colors no-underline"
    >
      {label}
    </a>
  );
}
