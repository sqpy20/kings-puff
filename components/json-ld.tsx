type JsonLdObject = Record<string, unknown>;

export default function JsonLd({
  data,
}: {
  data: JsonLdObject | JsonLdObject[];
}) {
  const entries = Array.isArray(data) ? data : [data];
  return (
    <>
      {entries.map((entry, idx) => (
        <script
          key={String(entry["@id"] ?? entry["@type"] ?? idx)}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(entry).replace(/</g, "\\u003c"),
          }}
        />
      ))}
    </>
  );
}
