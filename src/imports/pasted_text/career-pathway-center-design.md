You’re thinking in the right direction—but right now this is still a rough idea, not yet a build-ready system. A banking-level secure platform needs **structure, boundaries, and discipline** from day one. I’ll act as your project manager and convert this into a **professional, execution-ready master prompt + system design** you can actually build from.

---

# 🧠 PROJECT DEFINITION (Clear & Grounded)

**Product Name (working):** Career Pathway Center
**Type:** Secure Web App (SaaS-style)
**Core Goal:**
A highly secure, minimal UI platform where users track company interactions, hiring pipelines, and generate structured professional summaries.

---

# 🧱 SYSTEM ARCHITECTURE (Non-negotiable foundation)

### Frontend

* React.js (Vite)
* Motion.dev (animations)
* CSS: Tailwind + custom glassmorphism

### Backend (BaaS)

* Supabase

  * Auth (JWT + Row Level Security)
  * PostgreSQL DB
  * Storage (optional)

### AI Layer

* Groq LLM API (strict prompt-controlled summaries)

### Hosting

* Netlify (frontend)
* Supabase (backend)

---

# 🔐 SECURITY MODEL (Banking-Level Mindset)

Let’s be honest: “banking-level” doesn’t mean fancy UI—it means **paranoia + discipline**.

### Must-Have Security Features:

* Supabase Auth (email + password + OTP optional)
* Row-Level Security (RLS ON for all tables)
* Encrypted API calls (HTTPS only)
* No sensitive data stored in frontend state
* Strict input validation (frontend + backend)
* Rate limiting (via Supabase policies / edge functions)
* JWT session expiration
* Secure environment variables (Netlify)

---

# 🧾 DATABASE DESIGN (Clean + Scalable)

## 1. Users Table (Handled by Supabase Auth)

## 2. Profiles Table

```
id (uuid, pk)
user_id (fk)
full_name
created_at
```

## 3. Companies Table

```
id (uuid)
user_id (fk)
company_name
stage (enum)
priority (enum)
primary_contact_name
primary_email
company_website
created_at
```

## 4. Activities Table (Daily Logs)

```
id (uuid)
company_id (fk)
date
activity_text (8000 chars)
action_owner
help_required
created_at
```

## 5. Positions Table

```
id (uuid)
company_id (fk)
role
description
created_at
```

---

# 🧩 UI/UX SYSTEM (Minimal + Clean)

### 🎨 Design Rules

* Primary: `#e0653b`
* Secondary: `#142361`
* Background: White
* Fonts:

  * Headings → Lora
  * Body → Source Sans Pro

### ✨ Style

* Glassmorphism cards (blur + transparency)
* Soft shadows
* Rounded edges (12–16px)
* Smooth Motion.dev transitions

---

# 📄 PAGE STRUCTURE

## 1. Auth Page (CRITICAL)

![Image](https://images.openai.com/static-rsc-4/RBMIXS-Ooc2bGCMQQ1sXXUnHoK4ZvgQzi-5vwPztCFocMCD9UlxfTF7crWwnsAQGkvL77iLHzVCY6LkgGXW9vshtGpYtp86BKESckNznda9Mu_VtkBVyfiz8r6qpAyHLb7cqSS2CiRed1Er4ZZLfHVBKBXT3sZBL7_x--kWW7BWmImrKY2SKc_cqGw6FAYfg?purpose=fullsize)

![Image](https://images.openai.com/static-rsc-4/eDHR02LuRcXtCNn1W8cku0QnMi1qRDxr1m3ONv3wFul-MdpRTzrfqI84GkVy5xtPqhg-t2gcTKbcG0z-VJc4sL4uINLoioXydszQxkfAbUN8CSVyRq1jesAkjk18c8pCZWfIvZT6nlqvGLhrW6aU2D6vf8Kv4intYg25IpVejsS8avmyLkiKg2ZmlwRDs3bi?purpose=fullsize)

![Image](https://images.openai.com/static-rsc-4/b1WIhA_QNKVtLqKn_Zl8YPffJ1CJpJ-5-yfVZeawGwCohormeIk-ioownxYN1IQK34TBVdoafLKmWhgC_Aa3ZKkS03fMyopJmrhwaL5R3e8qYjhoC3aP_P4Upntuc8L0CoJR6ihjTBNStfbp2xEhq_71e8vg4xCQa_VkHAuF3ALub3_x6Mu8oKHklPa3Qb5P?purpose=fullsize)

![Image](https://images.openai.com/static-rsc-4/b_t6B5fFPY8Jo8mC3nh_1daPnZU2TH2ECYy2pFUXkpRlLTqGZxSj-biIgs-2n-2GBs7AyltmKuMSpxKfsT7Y1FDmcPgnlryEXnE0MML0OQCVp59oswb8RHZ7TDenowUKFIxVfobqlIXt1oKjQCOdoFcFISdtRUHav4V4s69tHRXW2HfyUhbaewXGuoiNYpYt?purpose=fullsize)

![Image](https://images.openai.com/static-rsc-4/Uunv5g74MhQ4x8CQEEWNXwtAvM1TI7XI-kry9fZEma5KK8s_el1i1itR9-50m8-ZaFlUtKH-Idk_dY-FwMGUKOpxrvgwJsam1kiUapBXplaHnsSqk5O9HXM6Gmu-2SSBLHPHk7_qK8PrnkB9FhUIHLUGWhvFwQlUA8NvotPAZNavXa7Gx3XMQID8PzTgNggt?purpose=fullsize)

![Image](https://images.openai.com/static-rsc-4/3KrWFl46yOZOanVaeRALC66hZNUPgKExddUrE4vDf7GO_1Gi4t2QDSBlY8-xvwXYnpXwM0t4ktUmEjmgJNcDyLhnmLEr1s6iLxxUks0JeVerw6RfysZ7Tqj3he7zSaGt23-SOA2tHVFjRrS86UPxtTbKfiGWnlhA_nkn9l1-dvEgulprG3_MLAaFN8W9pJxd?purpose=fullsize)

### Features:

* Login / Signup toggle
* Email + Password
* Password strength indicator
* Optional OTP (future)
* Error-safe messages (no data leaks)

---

## 2. Dashboard (Main System)

![Image](https://images.openai.com/static-rsc-4/KlUdcDKQVZ9TB5l-_CyA7EpGHAOGAHx0zep-DgOIEshuKh6J45n900onicJEGuGReeNY3wsXB3-R6Y3_TjT9_0AAmUCoy7D-vts8PhKghjVDdPdyH3hUW6orYJdJYvQ8ZNYsl0WON82Ea2PVCon0G7GGmlkUp3DCG5mZf1dyZf-H0fCdVRCbxzMHv04xm3rv?purpose=fullsize)

![Image](https://images.openai.com/static-rsc-4/FJqoYW7j9wjQg8mQ9gbnBCF8xtu68XtELgijpPysvADvb7OoSZQaoA80W6RH2W5MCCaobfN0RO7ueD6KH_Gy7LwZa36xZgFNvyp7J8RRytKwrBj778cDfyUp2BiUepKRiA68MTRH8-sI9H9zluzto6HcpUbDABSfQTZMxJYmBkHuVKFqpZ20c48kAuqMdAu1?purpose=fullsize)

![Image](https://images.openai.com/static-rsc-4/wOJLK3JVnJ6zSZPxJEpFvsQGkzwJ7yxH3w0c83-8t2z0CqVfbM-C_HK1oRBY2QzGgyz5Lvgc94t1AH7eA49NDjLiOKWFOw2KlSMPo85DSpSvIe56394bW7ML5uo_6TAYcud7W5EBlMAOdMtzwhiHKUrpVIHnoMABxrHMPrrvu6YC1ng8tLZlCqV9FFZ_w80O?purpose=fullsize)

![Image](https://images.openai.com/static-rsc-4/QcX1BLIv_RlGpkUW-PPU0df021jQaiuGP6J6XGDLSZ-eOIbifMvLfFAMb9Vd96ei74BhO-2RjpKYjFOA1BmdWX8B2biklakLiVkGDptrHwqbZrS5Elg107EJyNnpTu9u4Z8qgaXcX9JwL_6WL4WYoCwnedpumVslCq5lIk2n-t7-OuilXT0344pdJ9HCXd40?purpose=fullsize)

![Image](https://images.openai.com/static-rsc-4/cRrxx73qhIkUghfMQtQ20XKekTr3mRv9WyABkn9bY0Jx4EuXibmaZ3IXaK0l6tEMWILP6evXEU99VPSry2yf7fAEx8cTirOwlO9nJPGhEwoaHrZnGYsgTWtR7CKu6Fzd8pRFvJIwIHlp310iCAHJPLUFx3ukBjtcZ9wFKsradt2yKOCbQJgW4Dm4gYm39hsj?purpose=fullsize)

![Image](https://images.openai.com/static-rsc-4/ePqBQZmBVTO-VUdwwzqjlEOt8SG9j2cLuCcS7PwUZRxo-oJWkuO8Aa0uI1ZZ1G9rwD2X-Oz-WQm2WqyRlv9QHG3ZOjpXOubhzwoe9MOJJ3a9RClyiJiu8Ipp1M2FwVH9KkEbqHJIJMLWRBzcyPsofT_uUE6kzhl4y0081ePxoLtNNE7Y7ZQh9roV0GdVrf7H?purpose=fullsize)

### Components:

* ➕ Add Company
* 📋 Company Cards List
* 🔍 Filters (stage, priority)

---

## 3. Company Card (Collapsed View)

* Company Name
* Primary Contact
* Website
* Total Open Positions
* Priority Tag

---

## 4. Expanded View (Toggle)

* Full company details
* All positions listed
* Activity history (day-wise)

---

## 5. Activity Input Form

![Image](https://images.openai.com/static-rsc-4/HC-ygSiRlvCUF6NgYeKrbD81NGK5JKx-GiVo1UXG4DX_SclSabPJKZNMfOc-oZXQYNepGOoR6KElpLiJtHMLfy3Cc1nr9ZXzfS5hVgWSWeI0-G00LZANDgW8SoctwTXwzWsfe7dQU2rBslbQSbxZJsNdDlTT1sWXRTeRRev6fFNFVRProvoCwLO0kpmgpzMN?purpose=fullsize)

![Image](https://images.openai.com/static-rsc-4/0oewr4dlXPC4NZruGaoeFpJZVZE9nnbSrMYEgx5toBf0ae47YUxMbXnRFRPLadVzt8ZFdGCmAquVnqxWTvfQMmisXCpAsSQ8FUuZH9zBZJHzB9S5zGhm41UyTnMZkxgsRAQGzg-nO4E3j6jtHgzsNBByKfm6OVwUwZC02feryLYQJOiSpGUBjtQUeQbB5alD?purpose=fullsize)

![Image](https://images.openai.com/static-rsc-4/_9n3zdXVSkLKPHspPJdcjVGxdMeadGJFHTsmGXRY05BC1Shh7kJm9P15q6fMwuoiJIDDtE_6vqgGK_fC6bDFv6EwirJ_MXVjMt55INUDUFuiKNZTquNDAR613CKEj0cDnPSn-U6S4Hm3MOdQcTv0lKPivaphuRG45r-ENBPNyft-MhJdZbkPh4pBUUOgduKC?purpose=fullsize)

![Image](https://images.openai.com/static-rsc-4/Gpii5ESTBlBQv3ERqlWX9AvFgSKch26yssD3ZaznpQbmszj64_I23OijASNuvl0cDsB8WnYn4r4gVJ7YR5Gs9-qESIrxXsANwnrR30lyfQ4qfyMrxsex4mqAj7unS_5Xlllp153wd7bDDnMEQVS5HHNxVg2NWKqYJ_HEK1bkOEzbNMvRYYhXVo8O4uthXcaP?purpose=fullsize)

![Image](https://images.openai.com/static-rsc-4/RtBOvIJNxZg_nGA7gPJh7-5rREjY79y23fOIpM35Xo-0-ksRjk2LxPGsSYhv-SKXHkQ59VszsTZgzapNM2MBLw_p0POkJUJP61cJbFHlM3m4Dsq0sbMVStbzpxXiGLdEtFe2nPCMlBBr5N4sZzQbnP8nIpP2v-aArjt5-HE9rS5EifFrh2d2-z9_sbkNMTyJ?purpose=fullsize)

![Image](https://images.openai.com/static-rsc-4/Aj3FbBRBQszGMGrWza827YsoQJL_RtHgipBn3rmGa_9z9qMw5Ha5_CjO6IfOXIXl26mE7ZhMAo6ik9ky8-riHx2978kirfZWSeFDJlOIXYg0iNEa58g3nFn-4hqEhT2KoeK8YFxQVmsfQ-x84FzaAvXS2JhUnxjqOhb5FtNscf-i3tBTp47AL7DBGS9MKh2r?purpose=fullsize)

Fields:

* Activity (8000 chars)
* Stage (dropdown)
* Priority (dropdown)
* Action Owner
* Help Required

---

## 6. AI Summary Feature

Button:
👉 “Generate Professional Summary”

---

# 🤖 GROQ LLM STRICT PROMPT (VERY IMPORTANT)

Here’s your **production-grade prompt**:

```
SYSTEM PROMPT:

You are a professional career operations analyst.

Your task is to generate a structured, concise, and formal summary of company engagement activities.

STRICT RULES:
- No hallucination
- No assumptions
- Only use provided data
- Maintain professional tone
- No casual language
- Output must be structured

OUTPUT FORMAT:

Company: {company_name}

Engagement Summary:
- Key activities performed
- Progress across stages
- Major updates

Open Positions:
- Role: {role}
  Brief: {description}

Insights:
- Current status
- Risks or blockers
- Suggested next steps (based ONLY on given data)

INPUT DATA:
{activity_logs + company data}
```

---

# ⚙️ DEVELOPMENT ROADMAP (Execution Plan)

## Phase 1 (Foundation)

* Supabase setup
* Auth system
* Database schema
* RLS policies

## Phase 2 (Core UI)

* Login page
* Dashboard
* Company CRUD
* Activity logs

## Phase 3 (Advanced Features)

* Expandable cards
* Filters
* Position tracking

## Phase 4 (AI Integration)

* Groq API
* Summary generation

## Phase 5 (Polish)

* Motion.dev animations
* UI consistency
* Performance tuning

## Phase 6 (Deployment)

* Netlify deploy
* Env setup
* Testing

---

# 🚨 HARD TRUTHS (Project Manager Mode)

* “Banking-level security” ≠ just Supabase
  → It’s discipline in **every line of code**
* Biggest risk:
  ❌ messy schema
  ❌ weak validation
  ❌ overcomplicated UI
* Keep it simple. Ship fast. Then harden.

---

# 🧭 FINAL MASTER BUILD PROMPT (You can reuse this)

If you ever use AI to generate code, give it this:

```
Build a secure career tracking web application using:

Frontend:
- React (Vite)
- Tailwind CSS
- Motion.dev
- Fonts: Lora + Source Sans Pro

Backend:
- Supabase (Auth + PostgreSQL)
- Enable Row Level Security on all tables

Features:
1. Secure authentication (login/signup)
2. Company tracking system with:
   - stage (initiation, planning, execution, monitoring & control, closure)
   - priority (high, medium, low)
3. Daily activity logs (8000 char limit)
4. Position tracking per company
5. Expandable company cards UI
6. AI-generated professional summaries via Groq API

Design:
- Minimal UI
- Glassmorphism
- Colors:
  - Primary: #e0653b
  - Secondary: #142361
  - Background: white

Constraints:
- No insecure data exposure
- Validate all inputs
- Use modular components
- Maintain clean architecture
```

---

If you want, next step we can:
👉 Design **Supabase RLS policies (very critical)**
👉 Or build **actual React folder structure + code skeleton**

Just tell me.
