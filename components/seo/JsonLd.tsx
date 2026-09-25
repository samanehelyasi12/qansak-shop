/**
 * Renders a Schema.org JSON-LD block.
 *
 * Server-only and non-visual: it emits a single <script> element that the
 * browser does not render, so the approved design is unaffected.
 *
 * The payload is serialised with "<" escaped, so the JSON can never terminate
 * the surrounding <script> tag early.
 */
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
