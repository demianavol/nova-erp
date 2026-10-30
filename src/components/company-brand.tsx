export function CompanyBrand({ compact = false }: { compact?: boolean }) {
  return (
    <span className="yuc-brand" role="img" aria-label="Young Unicorn Company">
      <img
        src={`${import.meta.env.BASE_URL}yuc-mark.svg`}
        width="42"
        height="48"
        alt=""
      />
      {!compact && (
        <span className="yuc-wordmark" aria-hidden="true">
          <span>YOUNG</span>
          <span>UNICORN</span>
          <span>COMPANY</span>
        </span>
      )}
    </span>
  );
}
