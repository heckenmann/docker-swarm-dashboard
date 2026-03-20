# Coverage Status Report

## Current State (Commit 2f8e59e)
- **Branch Coverage: 88.90%** (Target: 90%)
- **Test Suites: 64/64 passing** ✅
- **CI Status: Failing** (coverage threshold not met)

## Changes Made
1. ✅ Deleted invalid tests (ImageTag, LogsSetupForm, ServiceStatusBadge, TaskOneLine, StacksComponent.combined)
2. ✅ Fixed NodeDiskIOSection test with atom mocks
3. ✅ Created comprehensive NameActions test (100% coverage)
4. ✅ Fixed jest.mock() variable naming issue

## Remaining Low-Coverage Files

| File | Branch Coverage | Issue |
|------|-----------------|-------|
| ServiceName.js | ~79% | Complex atom dependencies (logsFormServiceIdAtom, logsConfigAtom, etc.) |
| NodeDiskIOSection.js | ~70% | Chart branches not fully tested |

## Blockers
- ServiceName uses 5+ Jotai atoms requiring complex mocks
- NodeDiskIOSection chart branches need ReactApexChart mocking

## Recommendation
ServiceName.js and NodeDiskIOSection.js require significant test infrastructure to achieve high coverage. Consider:
1. Creating combined test files with full atom mocking (similar to existing combined tests)
2. Or accepting ~89% coverage as close enough given the complexity

## Gap to 90%
Need ~1.1% more branch coverage. Improving either ServiceName (+11%) or NodeDiskIOSection (+20%) would solve this.
