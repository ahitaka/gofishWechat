const COORDINATE_ADDRESS_RE = /^(坐标\s*)?-?\d{1,3}(\.\d+)?\s*[,，]\s*-?\d{1,3}(\.\d+)?$/;

export function hideCoordinateAddress(address?: string): string {
  const value = (address || "").trim();
  return COORDINATE_ADDRESS_RE.test(value) ? "" : value;
}
