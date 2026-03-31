# ORAII Integration Strategy
# All Documents → Both Portals
# Generated: March 2026

## What we have vs what we need

### Already built ✅
- DASS-21, PSS-10, UCLA-3 in assessmentInstruments.ts
- 3-tier Clinical Analysis Engine (Differential/Provisional/Final)
- IPS note format (NIMHANS/IPS 2025 standard)
- Hinglish taxonomy + cultural idioms
- C-SSRS risk detection
- CBT/DBT intervention database
- Voice assistant (Deepgram + ElevenLabs)
- Patient portal with Daji chatbot

### Missing — the connective tissue ❌
1. Tobacco comorbidity in clinical analysis (NIMHANS manual Chapter 1)
2. 5A's framework not in any prompt
3. NRT/Bupropion/Varenicline protocols not in pharmacotherapy
4. Loneliness patterns not in riskDetection.ts
5. UCLA-3, PSS-10, DASS-21 not offered by Daji conversationally
6. No "assessment recommendation" when patient describes symptoms
7. Substance use not triggering differential diagnosis path

## The 4-Layer Wellbeing Intelligence System

Layer 1 → SYMPTOMS      → DASS-21 (Depression/Anxiety/Stress subscales)
Layer 2 → STRESS        → PSS-10 (perceived overwhelm, control, coping)
Layer 3 → SOCIAL HEALTH → UCLA-3 (loneliness, isolation, connection)
Layer 4 → SUBSTANCE USE → NIMHANS 5A's (tobacco, alcohol, comorbidity)

These four layers together = complete psychosocial picture for Indian patients.

## Implementation Plan

### Change 1: substanceUseEngine.ts (new file)
- NIMHANS tobacco cessation protocols
- 5A's framework
- NRT, Bupropion, Varenicline details with Indian costs
- Nicotine withdrawal checklist
- Triggers it when substance use flagged in clinical analysis

### Change 2: Enhanced riskDetection.ts
- Add loneliness/social isolation patterns → MODERATE risk
- Link UCLA-3 as recommended instrument when detected
- Add tobacco withdrawal patterns → triggers substance comorbidity path

### Change 3: Enhanced patient-chat/route.ts (Daji)
- Daji knows DASS-21, PSS-10, UCLA-3 by name
- When patient describes sustained symptoms → Daji recommends instrument
- When loneliness detected → extra warmth + UCLA-3 suggestion to therapist
- When tobacco/stress mentioned → 4D coping techniques from NIMHANS manual

### Change 4: Enhanced clinicalAnalysisEngine.ts
- Add tobacco as mandatory differential consideration
- Add 5A's to clinical notes for substance-using patients
- Add loneliness as psychosocial factor in formulation

### Change 5: Patient portal — instrument surfacing
- After DASS-21 → auto-suggest PSS-10 if stress subscale elevated
- After PHQ-9 → auto-suggest UCLA-3 if social withdrawal noted
- Show "Recommended next assessment" based on clinical picture
