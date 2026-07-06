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
      className="inline-flex items-center justify-center rounded-md bg-brass px-5 py-2.5 text-sm font-semibold text-white hover:bg-brass/90 transition-colors no-underline"
    >
      {label}
    </a>
  );
}
