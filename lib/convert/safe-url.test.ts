// @vitest-environment node
import { describe, expect, test } from "vitest";

import { isPublicAddress } from "@/lib/convert/safe-url";

describe("isPublicAddress (기준 5)", () => {
  test.each([
    "127.0.0.1",
    "10.1.2.3",
    "172.16.0.1",
    "172.31.255.255",
    "192.168.0.10",
    "169.254.169.254",
    "0.0.0.0",
    "100.64.0.1",
    "::1",
    "::",
    "fe80::1",
    "fc00::1",
    "fd12:3456::1",
    "::ffff:127.0.0.1",
    "::ffff:10.0.0.1",
  ])("%s 는 공개 주소가 아니다", (ip) => {
    expect(isPublicAddress(ip)).toBe(false);
  });

  test.each(["93.184.216.34", "8.8.8.8", "172.32.0.1", "2606:4700::1111"])(
    "%s 는 공개 주소다",
    (ip) => {
      expect(isPublicAddress(ip)).toBe(true);
    },
  );
});
