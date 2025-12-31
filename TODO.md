# TODO - Faktory Protocol

> Tasks scoped to this project only. Claude sees this automatically.

---

## In Progress
<!-- Currently being worked on -->

- [ ] Demo Polish (Pre-Hackathon Submission)
  - Add contract address validation with error banner
  - Add timeout protection to agent analysis cycles
  - End-to-end user flow testing
  - Update deployment documentation


---

## Up Next
<!-- Prioritized and ready to start -->

- [ ] Deploy agent service to production (Railway/Render)
  - Update frontend with production agent WebSocket URL
  - Test live agent connection

- [ ] Production Hardening (Post-Demo)
  - Add rate limiting to AgentRouter.sol (contract level)
  - Optimize YieldVault with EnumerableSet (O(1) operations)
  - Add comprehensive test suite (frontend + agent)
  - Integrate real LendleYieldSource for actual DeFi yields


---

## Backlog
<!-- Captured but not yet prioritized -->

- [ ] QuickBooks OAuth production setup (currently demo mode)
- [ ] Secondary market for invoice NFTs
- [ ] Multi-signature custody for institutional users


---

## Completed
<!-- Done tasks - move here for reference, clean up periodically -->

- [x] Professional UI/UX redesign — completed 2024-12-31
  - Replaced orange/purple gradient design with blue/navy fintech aesthetic
  - Created 7 reusable components (StatCard, AnimatedCounter, StatusBadge, IconBox, FormField, DataTable, TransactionModal)
  - Removed 193 lines of duplicate code through consolidation
  - Established consistent 8pt spacing grid and typography scale
  - Captured before/after screenshots for all pages
  - Production-ready professional design quality

- [x] Mobile responsive fixes — completed 2024-12-30
  - Fixed Live Lendle Rates wrapping on mobile
  - Optimized key metrics spacing
  - Improved Powered By badges layout (2x2 grid on mobile)
  - Enhanced dashboard protocol banner stacking
  - Better footer layout on small screens


---

## Notes

- Tasks here are for THIS project only
- Use `/capture` to quickly add thoughts without breaking flow
- Move tasks between sections as status changes
- Clean up Completed section during `/weekly-review`
- **Project Status**: 85-90% complete, all core user flows working
