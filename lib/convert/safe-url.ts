import { isIP } from "node:net";

/** 사설망·로컬·링크로컬·예약 대역이 아니라 공개 인터넷 주소인지 판단한다. */
export function isPublicAddress(address: string): boolean {
  const kind = isIP(address);
  if (kind === 4) return isPublicV4(address.split(".").map(Number));
  if (kind === 6) return isPublicV6(address);
  return false;
}

function isPublicV4([a, b]: number[]): boolean {
  if (a === 0 || a === 10 || a === 127) return false;
  if (a === 100 && b >= 64 && b <= 127) return false; // CGNAT
  if (a === 169 && b === 254) return false; // 링크로컬, 클라우드 메타데이터
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 192 && b === 168) return false;
  if (a === 192 && b === 0) return false;
  if (a === 198 && (b === 18 || b === 19)) return false;
  if (a >= 224) return false; // 멀티캐스트, 예약, 브로드캐스트
  return true;
}

function isPublicV6(address: string): boolean {
  const groups = expandV6(address);
  if (groups.every((g) => g === 0)) return false; // ::
  if (groups.slice(0, 7).every((g) => g === 0) && groups[7] === 1) return false; // ::1
  // IPv4-mapped (::ffff:a.b.c.d)는 안쪽 IPv4로 판단한다.
  if (groups.slice(0, 5).every((g) => g === 0) && groups[5] === 0xffff) {
    return isPublicV4([groups[6] >> 8, groups[6] & 0xff]);
  }
  if ((groups[0] & 0xfe00) === 0xfc00) return false; // fc00::/7 ULA
  if ((groups[0] & 0xffc0) === 0xfe80) return false; // fe80::/10 링크로컬
  if ((groups[0] & 0xff00) === 0xff00) return false; // 멀티캐스트
  return true;
}

function expandV6(address: string): number[] {
  let text = address;
  const dotted = text.match(/(\d+\.\d+\.\d+\.\d+)$/);
  if (dotted) {
    const [a, b, c, d] = dotted[1].split(".").map(Number);
    text = text.slice(0, -dotted[1].length) +
      `${((a << 8) | b).toString(16)}:${((c << 8) | d).toString(16)}`;
  }
  const [left, right] = text.split("::");
  const l = left ? left.split(":") : [];
  const r = right === undefined ? [] : right ? right.split(":") : [];
  const fill = right === undefined ? 0 : 8 - l.length - r.length;
  return [...l, ...Array(fill).fill("0"), ...r].map((g) => parseInt(g, 16));
}

const LOCAL_NAME = /(^|\.)(localhost|local|internal|localdomain)$/i;

/** 이름이 로컬 전용임을 DNS 조회 없이 알 수 있는지. */
export function isLocalHostname(hostname: string): boolean {
  return LOCAL_NAME.test(hostname);
}
