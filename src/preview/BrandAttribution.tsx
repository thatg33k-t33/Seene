import { SEENE_BRAND } from "../core";

export function BrandAttribution({ showName = true }: { showName?: boolean }) {
  return (
    <span className="text-xs text-[#85858e]">
      {showName && <>{SEENE_BRAND.name} </>}by{" "}
      <a
        href={SEENE_BRAND.url}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-[#f1f1f4] hover:underline"
        aria-label={SEENE_BRAND.creator + " on Website (opens in a new tab)"}
      >
        {SEENE_BRAND.creator}
      </a>
    </span>
  );
}
