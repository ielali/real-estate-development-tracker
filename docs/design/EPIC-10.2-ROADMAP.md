# Epic 10.2: Design Alignment - Quick Roadmap

**Status:** 📋 Planned - Ready to Start
**Estimated Duration:** 8-10 days
**Created:** November 12, 2025

## 🎯 Quick Links

### Core Documents

- **Epic Overview:** `docs/epics/EPIC-10.2-Design-Alignment.md`
- **Gap Analysis:** `docs/design/NAVIGATION_GAP_ANALYSIS.md` (detailed)
- **Content Issue:** `docs/design/CONTENT_CENTERING_ISSUE.md` (specific problem)
- **Target Design:** `docs/design/new-navigation-proposals/main-dashboard-redesign.html`

### Story Files

1. **Story 10.10** - Top Header Bar: `docs/stories/10.10.story.md`
2. **Story 10.11** - Enhanced Sidebar: `docs/stories/10.11.story.md`
3. **Story 10.12** - Layout Integration: `docs/stories/10.12.story.md`
4. **Story 10.13** - Color System: `docs/stories/10.13.story.md`
5. **Story 10.14** - Icon System: `docs/stories/10.14.story.md`
6. **Story 10.15** - Content Layout: `docs/stories/10.15.story.md`

## 📊 Gap Summary

### ❌ Missing Components

- Global top header bar (search, notifications, CTA)
- User profile section in sidebar
- Hamburger toggle at top (currently at bottom)
- Secondary "Tools" navigation (Notifications, Settings, Help)

### ⚠️ Misaligned Features

- Color system (missing: primary-hover, primary-light, bg-tertiary)
- Icon system (no filled states for active items)
- Content layout (stays centered instead of expanding)
- Success color (#0E9267 → #10B981)

### ✅ Already Correct

- Primary color (#2563EB) ✅
- Sidebar collapse animation ✅
- Mobile navigation ✅
- All pages migrated ✅

## 🚀 Recommended Implementation Order

### Phase 1: Quick Wins (0.5 days)

**Story 10.15: Content Layout Fix**

- ⚡ Fastest to implement (2-3 hours)
- 🎁 Immediate visible benefit
- 🔒 Independent, no dependencies
- **Impact:** Content expands when sidebar collapses

**Do this first to get momentum!**

---

### Phase 2: Core Components (4 days)

#### Week 1, Days 1-2

**Story 10.10: Top Header Bar**

- 🔍 Add global search bar
- 🔔 Add notification button with badge
- ➕ Add primary CTA button
- **Impact:** Major UX improvement, search always available

#### Week 1, Days 3-4

**Story 10.11: Enhanced Sidebar**

- 👤 Add user profile section
- ☰ Move hamburger to top
- 🛠️ Add Tools navigation section
- **Impact:** Better identity context, standard layout

---

### Phase 3: Integration (2 days)

#### Week 2, Days 1-2

**Story 10.12: Layout Integration**

- 🔗 Integrate TopHeaderBar with layout
- 📐 Update ContentWrapper for two-tier header
- 🎬 Coordinate all animations
- **Impact:** Everything works together seamlessly

---

### Phase 4: Polish (1-2 days)

#### Week 2, Days 3-4 (Parallel)

**Story 10.13: Color System** (0.5 day)

- 🎨 Add missing color variants
- ✨ Update active states
- ♿ Verify WCAG AA compliance
- **Impact:** Better visual hierarchy

**Story 10.14: Icon System** (1-2 days)

- 🤔 Decide: Material Symbols or Lucide
- 🎯 Implement filled icon states
- 📏 Standardize sizes
- **Impact:** Consistent iconography

---

## 📅 Suggested Timeline

### Option A: 1 Developer (2 weeks)

```
Week 1:
Mon:     10.15 (half day) + 10.10 start
Tue-Wed: 10.10 complete
Thu-Fri: 10.11 complete

Week 2:
Mon-Tue: 10.12 complete
Wed:     10.13 complete
Thu-Fri: 10.14 complete + testing
```

### Option B: 2 Developers (1 week)

```
Dev 1:                    Dev 2:
Mon: 10.15 + 10.10       Mon: 10.11
Tue: 10.10               Tue: 10.11
Wed: 10.12               Wed: 10.13 + 10.14
Thu: 10.12               Thu: 10.14
Fri: Testing & Integration
```

## 🎯 Success Metrics

**Must Have:**

- ✅ All 6 stories complete
- ✅ Build passes (0 errors)
- ✅ Tests passing (1560+, 95% rate)
- ✅ Visual match ≥ 90%

**Quality Gates:**

- ✅ No horizontal scroll
- ✅ Sidebar collapse works smoothly
- ✅ Content expands properly
- ✅ WCAG AA compliance
- ✅ Bundle size < +50KB

## 🛠️ Key Decisions Needed

### Decision 1: Icon System (Story 10.14)

**Options:**

- A) Switch to Material Symbols (~+8KB bundle)
- B) Keep Lucide + filled wrapper (~+2KB bundle)

**Recommendation:** **Option B** (Lucide + filled wrapper)

- ✅ Lower bundle size impact
- ✅ Less migration effort
- ✅ Good approximation of filled state
- ✅ Easy to switch later if needed

### Decision 2: Search Implementation (Story 10.10)

**Options:**

- A) UI only (placeholder handler)
- B) Full search implementation

**Recommendation:** **Option A** (UI only)

- ✅ Keeps story scope manageable
- ✅ Search backend is separate epic
- ✅ Can add functionality later

### Decision 3: Rollout Strategy

**Options:**

- A) Deploy all stories at once (after full testing)
- B) Incremental deployment (story by story)

**Recommendation:** **Option A** (all at once)

- ✅ Components designed to work together
- ✅ Easier to test as a complete system
- ✅ Single QA cycle

## 📋 Pre-Implementation Checklist

Before starting Epic 10.2:

- [ ] Story 10.9 merged and deployed ✅
- [ ] All pages using new navigation ✅
- [ ] No open navigation bugs
- [ ] Gap analysis reviewed and understood
- [ ] Target design accessible
- [ ] Development environment set up
- [ ] Test database available

## 🧪 Testing Checklist

After each story:

- [ ] Component renders correctly
- [ ] Responsive (mobile, tablet, desktop)
- [ ] Keyboard accessible
- [ ] Screen reader compatible
- [ ] Dark mode working
- [ ] No console errors
- [ ] Build succeeds
- [ ] Tests pass

After full epic:

- [ ] All pages load without errors
- [ ] Sidebar collapse smooth on all pages
- [ ] Content expands when sidebar collapses
- [ ] Two-tier header works on project pages
- [ ] Mobile navigation unaffected
- [ ] Visual comparison with target design
- [ ] Performance (Lighthouse > 90)
- [ ] Bundle size acceptable

## 🚨 Risk Mitigation

### Low Risk Stories (Do First)

- ✅ Story 10.15: Content Layout (simple class changes)
- ✅ Story 10.13: Color System (additive tokens)

### Medium Risk Stories (Test Thoroughly)

- ⚠️ Story 10.11: Enhanced Sidebar (refactoring existing)
- ⚠️ Story 10.12: Layout Integration (multiple components)
- ⚠️ Story 10.14: Icon System (library decision)

### High Risk Areas (Extra Attention)

- 🔴 Animation coordination (multiple moving parts)
- 🔴 Z-index conflicts (header, sidebar, modals)
- 🔴 Mobile responsive behavior
- 🔴 Bundle size if switching to Material Symbols

### Mitigation Strategies

1. **Test after each change** (don't batch)
2. **Screenshot before/after** (visual regression)
3. **Keep Lucide as fallback** (during icon migration)
4. **Deploy to staging first** (not directly to production)
5. **Have rollback plan ready** (git revert commands prepared)

## 📚 Additional Resources

### Design References

- [Gap Analysis](NAVIGATION_GAP_ANALYSIS.md) - Complete analysis with code examples
- [Content Issue](CONTENT_CENTERING_ISSUE.md) - Root cause of centering problem
- [Target HTML](new-navigation-proposals/main-dashboard-redesign.html) - Reference design

### Code References

- Current Sidebar: `apps/web/src/components/layout/Sidebar.tsx`
- ContentWrapper: `apps/web/src/components/layout/ContentWrapper.tsx`
- Root Layout: `apps/web/src/app/layout.tsx`
- Color System: `apps/web/src/styles/globals.css`

### Testing Resources

- Test suite: `npm run test:run`
- Build: `npm run build`
- Type check: `npm run type-check`
- Lint: `npm run lint`

## 💡 Tips for Success

1. **Read the story fully** before starting
2. **Test frequently** (after each subtask)
3. **Commit often** (per task or subtask)
4. **Take screenshots** (before/after for comparison)
5. **Ask questions early** (don't wait until stuck)
6. **Document decisions** (especially for Story 10.14)
7. **Update the story** (mark tasks complete as you go)
8. **Write clear commit messages** (reference story number)

## 📝 Story Status Tracking

| Story | Title              | Status  | Days  | Priority |
| ----- | ------------------ | ------- | ----- | -------- |
| 10.10 | Top Header Bar     | 📋 Todo | 1-2   | High     |
| 10.11 | Enhanced Sidebar   | 📋 Todo | 1-2   | High     |
| 10.12 | Layout Integration | 📋 Todo | 1-2   | High     |
| 10.13 | Color System       | 📋 Todo | 0.5-1 | Medium   |
| 10.14 | Icon System        | 📋 Todo | 1-2   | Medium   |
| 10.15 | Content Layout     | 📋 Todo | 0.25  | High     |

**Legend:**

- 📋 Todo
- 🔄 In Progress
- ✅ Done
- ⏸️ Blocked
- ❌ Cancelled

## 🎉 Post-Epic Celebration

Once Epic 10.2 is complete:

**Immediate:**

- ✅ Merge to main
- ✅ Deploy to production
- ✅ Announce to team
- ✅ Update stakeholders
- ✅ Document learnings

**Follow-up:**

- 📊 Run Lighthouse audits
- 👥 Conduct user testing
- 📈 Monitor analytics
- 🐛 Collect bug reports
- 💬 Gather feedback

**Next Steps:**

- 🔍 Implement search functionality (new epic)
- 🔔 Build notification system (new epic)
- 🎨 Custom logo design
- 🧪 E2E test suite
- 📱 PWA enhancements

---

**Last Updated:** November 12, 2025
**Document Version:** 1.0
**Maintained By:** Dev Team

---

## Quick Start Command

```bash
# Start with Story 10.15 (quickest win)
git checkout -b story/10.15
code docs/stories/10.15.story.md

# Or start with Story 10.10 if you prefer
git checkout -b story/10.10
code docs/stories/10.10.story.md
```

**Good luck! 🚀**
