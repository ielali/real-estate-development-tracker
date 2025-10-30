# Partner User Journey Map

## "Login → View dashboard → Download report"

**Persona:** Maria Rodriguez
**Role:** Real Estate Investment Partner
**Experience Level:** Basic with technology, non-technical
**Device:** Primary: iPad (home/office), Secondary: iPhone (on-the-go)
**Goal:** Monitor project progress and understand where money is being spent

---

## Journey Overview

**Starting Point:** Received invitation email from developer
**End Goal:** View comprehensive project dashboard and download cost report for records
**Total Time (Current):** 8-10 minutes
**Total Time (Proposed):** 2-3 minutes
**Time Savings:** 70% improvement

---

## Current State Journey

### Stage 1: Accept Invitation & Login

#### Actions

1. Receive email: "You've been invited to Harbor View Apartments project"
2. Click email link
3. Lands on invitation acceptance page
4. Fill out registration form:
   - Email (pre-filled)
   - Create password
   - Confirm password
   - Accept terms
5. Submit form
6. Redirected to login page (confusing - just registered, why login again?)
7. Enter credentials again
8. Successfully logged in
9. Lands on home page (context-aware, shows accessible projects)

#### Touchpoints

- Invitation email
- Invitation acceptance page
- Registration form
- Login page (duplicate step)
- Home page with project list

#### Thoughts

- "Let me see this project Alex invited me to"
- "Okay, need to create an account... makes sense"
- "Wait, why do I need to log in again? I just registered"
- "Which project am I supposed to view?"

#### Emotions

- 🙂 Curious → 😕 Confused (duplicate login) → 😐 Neutral

#### Pain Points

- ⚠️ **Duplicate login step** - Just registered, why log in again?
- ⚠️ **No immediate project access** - Lands on generic home page, not project
- ⚠️ **No guidance** - Not clear what to do next
- ⚠️ **Terms checkbox** - Long legal text, just wants to view project

#### Time: **3-4 minutes**

---

### Stage 2: View Dashboard

#### Actions

1. See project card "Harbor View Apartments"
2. Click project card
3. Lands on project detail page with multiple tabs
4. Confused - "Where's the information for me?"
5. Notice "Dashboard" tab (after scanning)
6. Click "Dashboard" tab
7. Dashboard loads (2-3 seconds wait)
8. See cost breakdown pie chart
9. Scroll down to see activity timeline
10. Scroll more to see document gallery
11. Try to understand what data means
12. See terms like "Budget vs Actual", "Spending Velocity" - confused
13. Charts have no explanations or legends

#### Touchpoints

- Project card on home page
- Project detail page (multiple tabs)
- Dashboard tab
- Cost breakdown visualization
- Activity timeline
- Document gallery
- Advanced data visualizations (Story 4.4)

#### Thoughts

- "Okay, here's the project"
- "Where do I see the financial information?"
- "Ah, Dashboard tab - let me click that"
- "Hmm, lots of charts. What does 'Spending Velocity' mean?"
- "Is this good or bad? Over budget or under?"
- "I wish there was a summary I could understand"
- "The activity timeline is helpful, I can see recent updates"

#### Emotions

- 😕 Confused (too much data) → 😔 Overwhelmed → 😐 Resigned

#### Pain Points

- ⚠️ **Dashboard hidden behind tab** - Not obvious where to find it
- ⚠️ **No explanation of metrics** - "Spending Velocity", "Burn Rate" too technical
- ⚠️ **Cognitive overload** - Too many charts and data points
- ⚠️ **No summary or insights** - Just raw data, no interpretation
- ⚠️ **Small text on mobile** - Hard to read on iPhone
- ⚠️ **No onboarding for partners** - No guidance on how to use dashboard

#### Time: **4-5 minutes** (including confusion time)

---

### Stage 3: Download Report

#### Actions

1. Wants to save cost breakdown for records
2. Looks for download or export button
3. Finds "Export" button near cost breakdown chart
4. Clicks "Export" dropdown
5. Options: CSV, PDF, Excel
6. Selects "PDF"
7. PDF downloads (opens in new tab)
8. PDF shows cost data but:
   - No project name in header (just "Cost Report")
   - No date range specified
   - No partner name (who is this for?)
   - Chart quality is pixelated
   - No summary or total
9. Saves PDF to device for records
10. Closes browser, satisfied but not impressed

#### Touchpoints

- Export button on dashboard
- Export format dropdown
- PDF download (new tab)
- Saved PDF file

#### Thoughts

- "Let me download this for my records"
- "Where's the export button? Ah, there it is"
- "I'll get the PDF version"
- "This PDF is pretty basic... no header or totals"
- "At least I have the data saved"

#### Emotions

- 😐 Neutral → 🙂 Slightly satisfied (got what needed, but not impressed)

#### Pain Points

- ⚠️ **Export button not prominent** - Hard to find
- ⚠️ **PDF lacks context** - No project name, date range, partner name
- ⚠️ **Poor PDF formatting** - Pixelated charts, no branding
- ⚠️ **No summary** - Just raw data, no totals or insights
- ⚠️ **No email option** - Can't email PDF directly

#### Time: **1 minute**

---

### Current State Summary

| Metric                      | Value                                        |
| --------------------------- | -------------------------------------------- |
| **Total Time**              | 8-10 minutes                                 |
| **Total Clicks**            | 15-20 clicks                                 |
| **User Satisfaction**       | 4/10 (Confused and overwhelmed)              |
| **Likelihood to Recommend** | 5/10                                         |
| **Trust in Developer**      | Maintained (not increased)                   |
| **Frequency of Checks**     | 1-2 times/month (would check more if easier) |

**Biggest Pain Points:**

1. Dashboard hidden behind tab (discoverability)
2. Too much technical jargon (comprehension)
3. No explanations or guidance (confusion)
4. Poor mobile experience (text too small)
5. Basic PDF export (unprofessional)

---

## Proposed Future State Journey

### Stage 1: Accept Invitation & Login (Streamlined)

#### Actions

1. Receive email: "You've been invited to Harbor View Apartments 🏗️"
2. Email preview shows project image and key stats
3. Click "View Project Dashboard" button in email
4. Lands on invitation page with project context:
   - "Alex Chen invited you to Harbor View Apartments"
   - Project image and brief description
   - "Create account to view project updates"
5. Simplified registration (3 fields):
   - Email (pre-filled, can't edit)
   - Create password
   - Full name
6. Submit → Automatically logged in (no duplicate login step)
7. Lands directly on project dashboard (not generic home page)
8. Welcome modal appears: "Welcome! Let's show you around 👋"

#### Touchpoints

- Enhanced invitation email with preview
- Invitation page with project context
- Simplified registration form
- Automatic login after registration
- Project dashboard (direct access)
- Welcome onboarding modal

#### Thoughts

- "Oh nice, I can see the project details in the email"
- "Simple registration, just 3 fields"
- "Great, I'm logged in automatically!"
- "Perfect, I'm already looking at the project dashboard"
- "A quick tour? Sure, why not"

#### Emotions

- 🙂 Pleased (clear email) → 😊 Happy (easy registration) → 😃 Delighted (direct access)

#### Improvements

- ✅ **Enhanced email** - Project preview with image and key stats
- ✅ **Simplified registration** - 3 fields instead of 4
- ✅ **Automatic login** - No duplicate login step
- ✅ **Direct dashboard access** - Lands on project dashboard, not home page
- ✅ **Welcome onboarding** - Guided tour for partners

#### Time: **1-2 minutes** (60% faster)

---

### Stage 2: View Dashboard (Enhanced for Clarity)

#### Actions

1. Dashboard loads immediately (already on it)
2. See partner-friendly dashboard with clear sections:
   - **Project Summary Card** (top):
     - "Total Invested: $45,000"
     - "Total Spent: $27,000 (60%)"
     - "Budget Status: ✅ On Track"
     - "Last Updated: 2 hours ago"
   - **Where Your Money Is Going** (pie chart):
     - Clear labels: Materials (40%), Labor (35%), Permits (15%), Other (10%)
     - Tooltip on hover: "Materials: $10,800 (concrete, lumber, supplies)"
   - **Recent Activity** (timeline):
     - "2 hours ago: Added $500 electrical work"
     - "Yesterday: Uploaded 3 progress photos"
     - "2 days ago: Added $2,500 concrete pour"
   - **Latest Photos** (3 most recent):
     - Foundation progress
     - Framing work
     - Site overview
3. Each section has info icon (ℹ️) with explanation
4. Dashboard is mobile-optimized:
   - Collapsible sections
   - Large text (18px minimum)
   - Responsive charts
   - Swipe-friendly navigation

#### Touchpoints

- Project summary card (key metrics at top)
- Spending breakdown with tooltips
- Activity timeline
- Photo gallery
- Info icons with explanations
- Mobile-optimized layout

#### Thoughts

- "Perfect, I can see total invested and spent right away"
- "60% spent, that's good - we're on track"
- "This pie chart is clear, I understand where money is going"
- "Recent activity is helpful, I can see what's been happening"
- "These progress photos give me confidence in the project"
- "If I don't understand something, I can click the info icon"

#### Emotions

- 😊 Happy (clear information) → 😃 Delighted (easy to understand) → 🥰 Loving it (confidence in project)

#### Improvements

- ✅ **Partner-friendly language** - "Total Invested" instead of "Budget Allocated"
- ✅ **Key metrics at top** - Most important info visible immediately
- ✅ **Visual status indicators** - ✅ On Track, ⚠️ Caution, ❌ Over Budget
- ✅ **Tooltips with explanations** - Hover for detailed breakdown
- ✅ **Info icons** - Click to learn what each metric means
- ✅ **Mobile-optimized** - Large text, collapsible sections, responsive
- ✅ **Progress photos prominent** - Visual confidence builder

#### Time: **1 minute** (80% faster)

---

### Stage 3: Download Report (Professional PDF)

#### Actions

1. Wants to save report for records
2. Sees prominent "Download Report" button at top right
3. Clicks "Download Report"
4. Modal appears: "Generate Report"
   - Report type: "Cost Summary (PDF)" (default)
   - Date range: "All time" or "Custom range"
   - Include: ☑ Cost breakdown, ☑ Recent activity, ☑ Photos
   - Delivery: ○ Download now, ○ Email to me
5. Keeps defaults, clicks "Generate Report"
6. PDF generates in 2-3 seconds
7. Opens professional PDF with:
   - Project logo and name in header
   - "Report for Maria Rodriguez"
   - Date range: "Jan 1, 2025 - Oct 30, 2025"
   - Executive Summary:
     - "Total Invested: $45,000"
     - "Total Spent: $27,000 (60%)"
     - "Budget Remaining: $18,000"
     - "Status: ✅ On Track"
   - Cost Breakdown (pie chart, high quality)
   - Category Details (table with totals)
   - Recent Activity (last 10 events)
   - Progress Photos (3-4 photos)
   - Footer: "Generated by Real Estate Development Tracker"
8. PDF looks professional, ready to share with accountant
9. Also received email: "Your Harbor View Apartments report is ready"

#### Touchpoints

- Prominent "Download Report" button
- Report generation modal
- Professional PDF with branding
- Email notification with PDF attachment

#### Thoughts

- "Let me download a report for my accountant"
- "Oh nice, I can customize what's included"
- "I'll also get it emailed to me - convenient"
- "Wow, this PDF looks really professional!"
- "It has everything I need - summary, breakdown, photos"
- "My accountant will appreciate this formatting"
- "This developer is on top of things"

#### Emotions

- 😊 Happy (easy process) → 😃 Delighted (professional output) → 🥰 Impressed (trust increased)

#### Improvements

- ✅ **Prominent download button** - Always visible, clear label
- ✅ **Report customization** - Choose what to include, date range
- ✅ **Email delivery option** - Get PDF in inbox
- ✅ **Professional PDF** - Branded header/footer, clear formatting
- ✅ **Executive summary** - High-level insights, not just data
- ✅ **High-quality charts** - Vector graphics, not pixelated
- ✅ **Ready to share** - Looks professional for accountant/attorney

#### Time: **30 seconds** (50% faster)

---

### Proposed Future State Summary

| Metric                      | Current    | Proposed                | Improvement       |
| --------------------------- | ---------- | ----------------------- | ----------------- |
| **Total Time**              | 8-10 min   | 2-3 min                 | **70% faster**    |
| **Total Clicks**            | 15-20      | 6-8                     | **60% reduction** |
| **User Satisfaction**       | 4/10       | 9/10                    | **125% increase** |
| **Likelihood to Recommend** | 5/10       | 9.5/10                  | **90% increase**  |
| **Trust in Developer**      | Maintained | Significantly increased | ⬆️                |
| **Frequency of Checks**     | 1-2/month  | 1-2/week                | **4x increase**   |
| **Partner Engagement**      | Low        | High                    | ⬆️                |

**Biggest Improvements:**

1. ✅ **Direct dashboard access** - No hunting for information
2. ✅ **Partner-friendly language** - Non-technical, easy to understand
3. ✅ **Professional PDF reports** - Ready to share with advisors
4. ✅ **Mobile-optimized** - Large text, responsive, easy to use
5. ✅ **Visual confidence** - Progress photos, status indicators

---

## Emotional Journey Comparison

### Current State

```
🙂 Curious → 😕 Confused → 😔 Overwhelmed → 😐 Resigned
(Invitation)  (Dashboard)   (Too much data) (Got what needed)
```

**Overall Sentiment:** Confused and underwhelmed (4/10)
**Trust Impact:** Neutral (no change)

---

### Proposed State

```
🙂 Pleased → 😊 Happy → 😃 Delighted → 🥰 Impressed
(Easy signup) (Clear dashboard) (Understanding) (Professional report)
```

**Overall Sentiment:** Delighted and confident (9/10)
**Trust Impact:** Significantly increased ⬆️⬆️⬆️

---

## Key Opportunities from Journey Map

### 1. Invitation & Onboarding

**Problem:** Generic invitation, duplicate login, no guidance
**Solution:** Enhanced email with preview, automatic login, partner-specific onboarding

**Impact:**

- ✅ 60% faster first-time access
- ✅ 95% activation rate (up from 80%)
- ✅ Higher partner engagement

---

### 2. Dashboard Clarity & Comprehension

**Problem:** Technical jargon, no explanations, information overload
**Solution:** Partner-friendly language, tooltips, key metrics at top, info icons

**Impact:**

- ✅ 80% faster comprehension
- ✅ 125% satisfaction increase
- ✅ Significantly increased trust in developer

---

### 3. Mobile Experience

**Problem:** Small text, cramped layout, hard to use on phone
**Solution:** Mobile-optimized dashboard, large text (18px min), collapsible sections

**Impact:**

- ✅ 4x increase in mobile usage
- ✅ 1-2 checks per week (up from 1-2 per month)
- ✅ Higher partner engagement

---

### 4. Professional Reporting

**Problem:** Basic PDF, no branding, lacks context
**Solution:** Professional PDF with executive summary, branding, customization

**Impact:**

- ✅ 90% likelihood to recommend increase
- ✅ Partners share reports with advisors (credibility boost)
- ✅ Developer perceived as more professional

---

## Partner-Specific Insights

### What Partners Care About

**Primary Concerns:**

1. "Am I over budget?" → **Budget status indicator**
2. "Where is my money going?" → **Category breakdown with tooltips**
3. "Is the project progressing?" → **Progress photos + activity timeline**
4. "Can I trust this developer?" → **Professional reports + transparency**

**Secondary Concerns:**

1. "When will this be done?" → **Timeline view** (future enhancement)
2. "What's happening now?" → **Recent activity feed**
3. "Can I show this to my accountant?" → **Professional PDF reports**

### Partner Personas

**Persona A: Passive Investor (60%)**

- Just wants reassurance project is on track
- Checks dashboard 1-2 times per month
- Needs: Simple summary, status indicator, progress photos

**Persona B: Active Investor (30%)**

- Wants to understand details
- Checks dashboard 1-2 times per week
- Needs: Detailed breakdowns, tooltips, activity timeline

**Persona C: Professional Advisor (10%)**

- Accountant, attorney, or financial advisor
- Reviews reports on behalf of partner
- Needs: Professional PDF reports, detailed data, export options

**Design Implications:**

- Default view optimized for Persona A (simple summary)
- Expandable details for Persona B (click to learn more)
- Professional reports for Persona C (ready to share)

---

## Success Metrics

### Primary Metrics

- **Time to view dashboard:** 4-5 min → **1 min** (80% faster)
- **Partner satisfaction (NPS):** 20 → **75** (3.75x increase)
- **Partner activation rate:** 80% → **95%** (19% increase)

### Secondary Metrics

- **Frequency of dashboard checks:** 1-2/month → **1-2/week** (4x increase)
- **PDF report downloads:** 10/month → **40/month** (4x increase)
- **Partner-initiated communication:** Rarely → **Frequently** (trust indicator)
- **Likelihood to recommend:** 5/10 → **9.5/10** (90% increase)

### Business Impact

- **Partner retention:** Higher (more engaged partners stay invested)
- **Developer credibility:** Increased (professional reporting)
- **Future fundraising:** Easier (happy partners refer others)
- **Support burden:** Lower (clear dashboard reduces questions)

---

## Accessibility for Partners

### Considerations

**Age Range:** 40-70 years old (many older investors)

**Technical Proficiency:** Low to Medium

**Accessibility Needs:**

- Large text (18px minimum on mobile)
- High contrast (WCAG AA compliance)
- Simple language (no jargon)
- Clear visual hierarchy
- Tooltips for explanations

**Implementation:**

- Font size: 18px body text on mobile, 16px desktop
- Color contrast: 4.5:1 minimum
- Language: 8th grade reading level maximum
- Icons + text (not icons only)
- Consistent patterns across dashboard

---

## Mobile-Specific Optimizations for Partners

### iPhone/iPad Experience

**Portrait Mode (default):**

- Collapsible sections (expand to see details)
- Large touch targets (56px minimum)
- Swipe between sections (alternative to scrolling)
- Bottom sheet for actions (filters, export)

**Landscape Mode:**

- Side-by-side layout (summary + details)
- Better chart viewing
- More content visible

**Tablet (iPad):**

- 2-column layout (summary left, details right)
- Larger charts and photos
- Desktop-like experience

**Dark Mode Support:**

- Respect system preference
- Good for viewing at night
- Reduces eye strain

---

## Next Steps

1. **Validate journey map** - User testing with 5 real partners (various ages)
2. **Test mobile experience** - On real devices (iPhone, iPad)
3. **Prioritize improvements** - Focus on dashboard clarity and PDF reports
4. **Implement changes** - Stories 5.2 & 5.3
5. **Measure impact** - Track NPS, engagement frequency, trust indicators
6. **Iterate** - Refine based on partner feedback

---

**Document Version:** 1.0
**Last Updated:** October 30, 2025
**Next Review:** After Story 5.3 implementation
