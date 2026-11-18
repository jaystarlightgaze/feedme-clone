# 공개 배포된 변환 API에 남용 방지가 없음

**Symptom**: 서버가 사용자가 넣은 임의의 URL을 대신 가져오는데, 요청 속도 제한 같은 남용 방지가 없습니다. 앱은 이제 공개 배포되었습니다.

**Observed evidence**: url-to-markdown 스펙이 이 항목을 "공개 URL로 배포하기로 결정하는 시점에 다시 연다"는 조건으로 미뤄 두었고, 사용자가 배포를 확인하면서 그 조건이 충족되었습니다. `app/api/convert/route.ts`에는 SSRF 주소 차단만 있습니다.

**Suspected cause**: 첫 버전에서는 배포 계획이 정해지지 않아, 임시 동작으로 SSRF 차단만 두기로 했습니다.

**What was tried**: 사설망·로컬·링크로컬 주소와 그런 곳으로의 리다이렉트만 차단합니다. 요청 횟수 제한은 하지 않습니다. DNS 재바인딩 틈은 [url-to-markdown.md](url-to-markdown.md)에 따로 기록되어 있습니다.

**Proposed next step**: 공개 배포 환경에서 남용 방지(요청 속도 제한 등)가 필요한지, 필요하다면 어느 수준인지 사람이 정한 뒤 스펙으로 만듭니다.
