# AI Features - Cost & Resource Analysis

**Document Version:** 1.0
**Date:** 2025-11-02
**Status:** Draft

---

## Executive Summary

This analysis estimates the costs and resources required to implement AI-powered natural language querying and intelligent document processing features. The analysis covers API costs, infrastructure, development time, and ongoing operational expenses.

### Quick Cost Overview (Monthly - Moderate Usage)

| Category                   | Low Usage    | Moderate Usage      | High Usage       |
| -------------------------- | ------------ | ------------------- | ---------------- |
| **LLM API Costs**          | $150-300     | $500-1,000          | $2,000-4,000     |
| **Document Processing**    | $100-200     | $400-800            | $1,500-3,000     |
| **Infrastructure**         | $50-100      | $100-200            | $300-500         |
| **Storage (incremental)**  | $20-50       | $50-100             | $150-300         |
| **Total Monthly**          | **$320-650** | **$1,050-2,100**    | **$3,950-7,800** |
| **Development (one-time)** |              | **$60,000-120,000** |                  |

### Usage Assumptions

- **Low Usage:** 10 users, 500 NL queries/month, 200 documents/month
- **Moderate Usage:** 50 users, 2,500 NL queries/month, 1,000 documents/month
- **High Usage:** 200 users, 10,000 NL queries/month, 5,000 documents/month

---

## 1. LLM API Costs (Natural Language Querying)

### Provider Comparison

#### Option A: Anthropic Claude (Recommended)

**Model:** Claude 3.5 Sonnet or Claude 3 Haiku

**Pricing:**

- Claude 3.5 Sonnet: $3.00 per million input tokens, $15.00 per million output tokens
- Claude 3 Haiku: $0.25 per million input tokens, $1.25 per million output tokens

**Estimated Token Usage per NL Query:**

- Schema context: ~2,000 tokens (input)
- User query: ~50 tokens (input)
- Response (SQL + explanation): ~300 tokens (output)
- **Total per query:** ~2,350 tokens (~$0.005 with Haiku, ~$0.01 with Sonnet)

**Recommended Strategy:** Use Haiku for simple queries, Sonnet for complex analysis

**Monthly Costs:**

- 500 queries: $2.50-5.00
- 2,500 queries: $12.50-25.00
- 10,000 queries: $50-100

#### Option B: OpenAI GPT-4o

**Pricing:**

- GPT-4o: $2.50 per million input tokens, $10.00 per million output tokens
- GPT-4o-mini: $0.15 per million input tokens, $0.60 per million output tokens

**Estimated costs similar to Claude but with slightly different quality/speed tradeoffs**

**Monthly Costs:**

- 500 queries: $2-4
- 2,500 queries: $10-20
- 10,000 queries: $40-80

#### Option C: Self-Hosted LLM (Advanced)

**Initial Setup:** $10,000-30,000 (GPU infrastructure)
**Ongoing:** $500-2,000/month (GPU instance, maintenance)

**Only cost-effective at >50,000 queries/month**

### Recommended Approach

**Hybrid Strategy:**

1. Start with Claude 3 Haiku for 80% of queries (simple)
2. Use Claude 3.5 Sonnet for complex analysis/reports (20%)
3. Implement aggressive caching for schema context (saves ~85% on input tokens)
4. Cache frequently asked queries

**Optimized Monthly Costs:**

- 500 queries: $1-2 (with caching)
- 2,500 queries: $5-10
- 10,000 queries: $20-40

---

## 2. Document Processing Costs

### Provider Comparison

#### Option A: AWS Textract (Recommended for Australian documents)

**Pricing:**

- Detect Document Text: $1.50 per 1,000 pages
- Analyze Document (tables/forms): $50 per 1,000 pages
- Analyze Expense (receipts/invoices): $50 per 1,000 pages

**Typical Processing:**

- Invoice (1-2 pages): $0.10-0.15 with Analyze Expense
- Contract (5-10 pages): $0.25-0.50 with Analyze Document
- Receipt (1 page): $0.05 with Analyze Expense
- Permit (2-4 pages): $0.10-0.20 with Detect Text + LLM

**Average per document:** ~$0.15

**Monthly Costs:**

- 200 documents: $30
- 1,000 documents: $150
- 5,000 documents: $750

**Pros:**

- Excellent Australian format recognition (ABN, dates, currency)
- Built-in invoice/receipt extraction
- Reliable at scale
- Pay per use

#### Option B: Google Document AI

**Pricing:**

- General OCR: $1.50 per 1,000 pages
- Specialized parsers (invoice, receipt): $30 per 1,000 pages
- Custom document parsers: $60 per 1,000 pages

**Similar cost structure to Textract, slightly cheaper for simple OCR**

**Average per document:** ~$0.12

**Pros:**

- Good international format support
- Customizable parsers
- Integration with Google Cloud

#### Option C: Azure Form Recognizer

**Pricing:**

- Prebuilt invoice: $40 per 1,000 pages
- Prebuilt receipt: $40 per 1,000 pages
- Custom models: $50 per 1,000 pages

**Average per document:** ~$0.14

**Pros:**

- Strong structured extraction
- Good for consistent document types

### LLM Post-Processing (Required for all options)

After OCR, need LLM to extract structured data:

- **Token usage per document:** ~1,500 input (OCR text) + ~500 output (structured JSON)
- **Cost per document:** ~$0.002 with Haiku, ~$0.005 with GPT-4o-mini

### Recommended Approach

**AWS Textract + Claude Haiku Pipeline:**

- Textract for OCR/initial extraction: $0.15/doc
- Claude Haiku for structured data extraction: $0.002/doc
- **Total per document:** ~$0.152

**Monthly Costs:**

- 200 documents: $30
- 1,000 documents: $152
- 5,000 documents: $760

**Cost Optimizations:**

- Batch processing (20% cost reduction)
- Smart routing (simple receipts use cheaper OCR)
- User-confirmed learning (reduce reprocessing)

---

## 3. Infrastructure Costs

### Database (PostgreSQL - Neon)

**Current:** Already using Neon PostgreSQL

**Additional Requirements:**

- Vector storage for embeddings (optional): +$20-50/month
- Increased query load: +$20-50/month
- Additional indexes: negligible (included in existing plan)

**Estimated Addition:** $40-100/month

### Compute (Vercel/Netlify)

**Current:** Already deployed

**Additional Requirements:**

- Increased serverless function execution (NL queries): +$20-50/month
- Document processing functions (longer execution): +$50-100/month
- Background job processing: +$20-50/month

**Estimated Addition:** $90-200/month

### Storage (Netlify Blobs)

**Current:** Already using for documents

**Additional Requirements:**

- Processed document cache: +$20-50/month
- Query result caching: +$10-20/month
- AI training data/logs: +$10-30/month

**Estimated Addition:** $40-100/month

### CDN/Bandwidth

**Negligible increase:** <$20/month

### Monitoring & Logging

**AI-specific logging:**

- Confidence scores, errors, user feedback
- **Cost:** $20-50/month (DataDog, Sentry, or similar)

**Total Infrastructure Addition:** $190-470/month

---

## 4. Development Resources

### Phase 1: Foundation (4 weeks)

**Tasks:**

- Set up LLM API integration
- Create tRPC endpoints for AI features
- Basic NL query interface
- Document type detection

**Resources:**

- 1 Senior Full-Stack Engineer: 160 hours @ $150/hr = $24,000
- Total: **$24,000**

### Phase 2: Core Features (4 weeks)

**Tasks:**

- Natural language query execution
- Document data extraction for invoices
- Confidence scoring system
- Review UI

**Resources:**

- 1 Senior Full-Stack Engineer: 160 hours @ $150/hr = $24,000
- 1 Mid-Level Engineer: 80 hours @ $100/hr = $8,000
- Total: **$32,000**

### Phase 3: Enhancement (4 weeks)

**Tasks:**

- Fuzzy matching for entities
- Learning from corrections
- Advanced document types
- Predictive analytics

**Resources:**

- 1 Senior Full-Stack Engineer: 120 hours @ $150/hr = $18,000
- 1 Mid-Level Engineer: 120 hours @ $100/hr = $12,000
- Total: **$30,000**

### Phase 4: Polish & Testing (4 weeks)

**Tasks:**

- Bulk processing
- Auto-approval rules
- Performance optimization
- Comprehensive testing
- Documentation

**Resources:**

- 1 Senior Full-Stack Engineer: 80 hours @ $150/hr = $12,000
- 1 Mid-Level Engineer: 80 hours @ $100/hr = $8,000
- 1 QA Engineer: 80 hours @ $80/hr = $6,400
- Total: **$26,400**

### Ongoing Maintenance (Monthly)

- Bug fixes, model updates, optimization: 20-40 hours/month
- **Cost:** $3,000-6,000/month

**Total Development Investment:** $112,400 (16 weeks)

**Conservative Range:** $100,000-150,000 (accounting for unknowns)

---

## 5. Total Cost of Ownership (First Year)

### Scenario A: Low Usage (10 users, MVP)

| Category            | One-Time     | Monthly    | Year 1 Total |
| ------------------- | ------------ | ---------- | ------------ |
| Development         | $112,400     | -          | $112,400     |
| LLM APIs            | -            | $150       | $1,800       |
| Document Processing | -            | $100       | $1,200       |
| Infrastructure      | -            | $90        | $1,080       |
| Storage             | -            | $40        | $480         |
| Monitoring          | -            | $20        | $240         |
| Maintenance         | -            | $3,000     | $36,000      |
| **Total**           | **$112,400** | **$3,400** | **$153,200** |

### Scenario B: Moderate Usage (50 users, Production)

| Category            | One-Time     | Monthly    | Year 1 Total |
| ------------------- | ------------ | ---------- | ------------ |
| Development         | $112,400     | -          | $112,400     |
| LLM APIs            | -            | $500       | $6,000       |
| Document Processing | -            | $400       | $4,800       |
| Infrastructure      | -            | $150       | $1,800       |
| Storage             | -            | $70        | $840         |
| Monitoring          | -            | $35        | $420         |
| Maintenance         | -            | $4,500     | $54,000      |
| **Total**           | **$112,400** | **$5,655** | **$180,260** |

### Scenario C: High Usage (200 users, Scale)

| Category            | One-Time     | Monthly     | Year 1 Total |
| ------------------- | ------------ | ----------- | ------------ |
| Development         | $112,400     | -           | $112,400     |
| LLM APIs            | -            | $2,000      | $24,000      |
| Document Processing | -            | $1,500      | $18,000      |
| Infrastructure      | -            | $400        | $4,800       |
| Storage             | -            | $200        | $2,400       |
| Monitoring          | -            | $50         | $600         |
| Maintenance         | -            | $6,000      | $72,000      |
| **Total**           | **$112,400** | **$10,150** | **$234,200** |

---

## 6. Cost Per User/Transaction

### Natural Language Query

**Cost per query (optimized):**

- Simple query: $0.001-0.002
- Complex query: $0.005-0.01
- Average: **$0.003**

**User value calculation:**

- Time saved per query: 2-5 minutes (vs manual filtering)
- Labor cost saved: $1-4 per query (at $30/hr)
- **ROI:** 100-400x per query

### Document Processing

**Cost per document:**

- Receipt: $0.05-0.10
- Invoice: $0.15-0.20
- Contract: $0.25-0.50
- Average: **$0.20**

**User value calculation:**

- Time saved per document: 3-10 minutes (vs manual entry)
- Labor cost saved: $1.50-5.00 (at $30/hr)
- Accuracy improvement: 80-95% error reduction
- **ROI:** 7-25x per document

### Monthly Per-User Cost

**Moderate usage (50 NL queries + 20 docs/user/month):**

- NL queries: $0.15
- Document processing: $4.00
- Infrastructure (allocated): $3.10
- **Total per user:** ~$7.25/month

**Labor savings:**

- NL queries: 50 queries × 3 min × $0.50/min = $75
- Documents: 20 docs × 5 min × $0.50/min = $50
- **Total saved:** ~$125/user/month

**Net savings:** $117.75/user/month (16x ROI)

---

## 7. Cost Optimization Strategies

### Immediate Optimizations

1. **Aggressive caching** - Cache schema context, common queries (85% token reduction)
2. **Smart model selection** - Use cheaper models for simple tasks
3. **Batch processing** - Process documents in batches (20% cost reduction)
4. **Result caching** - Cache query results for 5 minutes
5. **Compression** - Compress prompts and responses

**Potential savings:** 40-60% reduction in API costs

### Medium-Term Optimizations

1. **Fine-tuned models** - Custom models for common document types ($500 setup, 50% cost reduction)
2. **Local processing** - Use local models for simple classification
3. **Smart routing** - Route to appropriate processing level based on complexity
4. **User learning** - Learn from corrections to reduce API calls

**Potential savings:** Additional 20-30% reduction

### Long-Term Optimizations

1. **Self-hosted LLMs** - If volume exceeds 50,000 queries/month
2. **Custom OCR models** - Train on Australian-specific documents
3. **Edge processing** - Process simple documents client-side

**Break-even point:** ~100,000 documents/month or 200,000 queries/month

---

## 8. Risk & Contingency Budget

### API Cost Overruns

**Risk:** User adoption exceeds estimates by 2-3x

**Mitigation:**

- Set usage limits per user/organization
- Alert system for unusual usage patterns
- Rate limiting on expensive operations

**Contingency:** +50% monthly API budget ($500-1,500/month)

### Development Delays

**Risk:** Implementation takes 20-24 weeks instead of 16

**Mitigation:**

- Phased rollout (MVP → Full features)
- Parallel development where possible
- Reuse existing patterns

**Contingency:** +$30,000-50,000 development budget

### Quality Issues

**Risk:** Accuracy below acceptable thresholds (95% for documents)

**Mitigation:**

- Extensive testing phase
- Human review queue
- Confidence thresholds
- Continuous learning loop

**Contingency:** +20-40 hours/month maintenance ($3,000-6,000/month)

**Total Contingency Budget:** $50,000-100,000 (Year 1)

---

## 9. Alternative Approach: Phased Rollout to Manage Costs

### Phase 1: MVP (8 weeks, $50,000)

**Features:**

- Basic NL query for costs only
- Simple invoice processing
- Manual review required for all extractions

**Monthly operational cost:** $400-800
**Test with:** 5-10 early adopter users

### Phase 2: Core Features (8 weeks, $60,000)

**Add:**

- Full entity NL querying
- Multi-document types
- Confidence scoring
- Partial auto-approval

**Monthly operational cost:** $1,000-2,000
**Scale to:** 25-50 users

### Phase 3: Advanced Features (12 weeks, $80,000)

**Add:**

- Predictive analytics
- Learning from corrections
- Bulk operations
- Partner AI features

**Monthly operational cost:** $2,000-4,000
**Scale to:** 100+ users

**Total phased investment:** $190,000 over 28 weeks

---

## 10. Recommendations

### Recommended Approach: Phased MVP

**Rationale:**

1. Validate AI feature value before full investment
2. Learn user behavior to optimize costs
3. Test accuracy thresholds in production
4. Manage risk with smaller initial investment

### Recommended Tech Stack

1. **LLM:** Claude 3 Haiku (primary) + Claude 3.5 Sonnet (complex queries)
2. **Document Processing:** AWS Textract + Claude Haiku
3. **Infrastructure:** Keep existing Netlify/Neon stack
4. **Caching:** Redis/Upstash for aggressive result caching

### Recommended Pricing Strategy for Users

**Consideration:** Pass costs to users with premium tier

**Suggested pricing:**

- **Basic tier:** No AI features (existing functionality)
- **Pro tier:** +$15/user/month (includes 50 queries + 20 documents)
- **Business tier:** +$30/user/month (includes 200 queries + 100 documents)

**Margin:** 2-4x markup covers development, maintenance, and growth

### Break-Even Analysis

**Assuming Pro tier ($15/user/month):**

- Cost per user: $7.25/month (at moderate usage)
- Margin: $7.75/month
- Development cost recovery: $112,400 ÷ $7.75 = 14,503 user-months
- Break-even with 50 users: ~24 months
- Break-even with 100 users: ~12 months
- Break-even with 200 users: ~6 months

**With Business tier and mixed adoption: 8-15 month break-even**

---

## 11. Cost Summary & Decision Matrix

### Option A: Full Implementation (16 weeks)

- **Investment:** $112,400 (dev) + $50,000 (contingency) = $162,400
- **Monthly cost:** $5,655 (at moderate usage)
- **Break-even:** 12-18 months (100+ users)
- **Risk:** High (large upfront investment)
- **Reward:** High (competitive advantage, full feature set)

### Option B: Phased MVP (8 weeks + iterate)

- **Initial investment:** $50,000
- **Monthly cost:** $800 (MVP phase)
- **Validation period:** 3-6 months
- **Incremental investment:** Based on validated demand
- **Risk:** Low (can pause if not validated)
- **Reward:** Moderate (learn and adjust)

### Option C: No AI Features

- **Investment:** $0
- **Monthly cost:** $0
- **Competitive risk:** Competitors may implement AI features
- **Opportunity cost:** $125/user/month in labor savings

### Recommendation: **Option B (Phased MVP)**

**Rationale:**

1. Manageable initial investment ($50,000 vs $162,400)
2. Real-world validation before full commitment
3. Learn usage patterns to optimize costs
4. Demonstrate ROI to justify additional investment
5. Can pivot or enhance based on feedback

**Next Steps:**

1. Secure $50,000 budget for MVP phase
2. Plan 8-week development sprint
3. Identify 5-10 beta users
4. Define success metrics (90% query satisfaction, 95% document accuracy)
5. Evaluate after 3 months to decide on Phase 2

---

## Appendix A: Detailed API Pricing References

### Anthropic Claude (as of 2025-01)

- Claude 3.5 Sonnet: $3.00/$15.00 per MTok (input/output)
- Claude 3 Haiku: $0.25/$1.25 per MTok (input/output)
- Claude 3 Opus: $15.00/$75.00 per MTok (input/output)

### OpenAI (as of 2025-01)

- GPT-4o: $2.50/$10.00 per MTok (input/output)
- GPT-4o-mini: $0.15/$0.60 per MTok (input/output)
- GPT-4 Turbo: $10.00/$30.00 per MTok (input/output)

### AWS Textract

- Detect Document Text: $1.50 per 1,000 pages
- Analyze Document: $50.00 per 1,000 pages
- Analyze Expense: $50.00 per 1,000 pages
- Analyze ID: $40.00 per 1,000 pages

### Google Document AI

- Document OCR: $1.50 per 1,000 pages
- Specialized processors: $30-60 per 1,000 pages

### Azure Form Recognizer

- Prebuilt models: $40-50 per 1,000 pages
- Custom models: $50 per 1,000 pages + $40/month training

---

## Appendix B: ROI Calculation Worksheet

### Assumptions

- Average user labor rate: $30/hour ($0.50/minute)
- Current time per cost entry: 5 minutes
- Current time per invoice processing: 8 minutes
- AI processing time: <30 seconds
- Accuracy improvement: 85% (fewer corrections needed)

### Monthly Savings per User (Moderate Usage)

| Activity                    | Manual      | With AI    | Time Saved  | Value Saved |
| --------------------------- | ----------- | ---------- | ----------- | ----------- |
| 50 cost lookups/queries     | 150 min     | 25 min     | 125 min     | $62.50      |
| 20 invoice/document entries | 160 min     | 20 min     | 140 min     | $70.00      |
| Data corrections/audits     | 60 min      | 10 min     | 50 min      | $25.00      |
| **Total**                   | **370 min** | **55 min** | **315 min** | **$157.50** |

### Annual Savings per User

- **Time saved:** 3,780 minutes (63 hours)
- **Value saved:** $1,890
- **AI cost:** $87/year
- **Net savings:** $1,803/year/user

### Organization-Level ROI (50 users)

- **Annual savings:** $94,650
- **Year 1 costs:** $180,260 (includes dev)
- **Year 1 ROI:** -48% (investment year)
- **Year 2 costs:** $67,860 (operational only)
- **Year 2 ROI:** +39%
- **Year 3+ ROI:** +55% annually

**Cumulative ROI:**

- Break-even: Month 18
- 3-year total savings: $106,090
- 5-year total savings: $328,610

---

**Document prepared by:** Claude Code Assistant
**Review required by:** Project stakeholders, finance team, technical lead
**Next update:** After MVP phase (3 months)
