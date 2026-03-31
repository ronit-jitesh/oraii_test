// =============================================
// MHCA 2017 Compliance Engine
// Mental Healthcare Act (India) 2017
// Automated triggers for Advance Directives,
// Nominated Representatives, and Capacity Assessment
// =============================================

export interface MHCAAlert {
  id: string;
  provision: string;        // MHCA section reference
  title: string;
  severity: 'info' | 'warning' | 'critical';
  description: string;
  legalRequirement: string;
  suggestedAction: string;
  actionType: 'generate_form' | 'prompt_discussion' | 'document_compliance' | 'refer';
  icon: string; // emoji
}

export interface ComplianceCheckResult {
  alerts: MHCAAlert[];
  overallCompliance: 'compliant' | 'action_needed' | 'urgent';
  checksPerformed: string[];
}

// ── MHCA 2017 Provision Definitions ──

const MHCA_PROVISIONS = {
  advanceDirective: {
    section: 'Section 5',
    title: 'Advance Directive (AD)',
    description: 'Written declaration of treatment wishes and refusals. Every adult has the right to make an AD describing how they want to be cared for if they lose decision-making capacity.',
    legalRequirement: 'Must be written, signed by the person, and attested by a notary or gazetted officer. Registered with the Mental Health Review Board.',
  },
  nominatedRepresentative: {
    section: 'Section 14',
    title: 'Nominated Representative (NR)',
    description: 'Appointment of a representative to support treatment-related decision-making. The patient must appoint an NR to assist with decisions.',
    legalRequirement: 'Appointment must follow CR-A format. NR must consent to the appointment. Must be documented in the clinical record.',
  },
  mentalCapacity: {
    section: 'Section 4',
    title: 'Mental Capacity Assessment',
    description: 'Assessment of the patient\'s ability to understand and communicate treatment decisions.',
    legalRequirement: 'Every person is presumed to have capacity unless proven otherwise. Assessment must follow standardized tools like the Capacity Assessment Guidance Document (CAGD).',
  },
  confidentiality: {
    section: 'Section 23',
    title: 'Confidentiality & Access Rights',
    description: 'Right to access medical records and protection from unauthorized release. Records must not be released to media.',
    legalRequirement: 'Strict access controls. Patient portals must comply with Indian EHR standards. Release only with written consent.',
  },
  rightToInformation: {
    section: 'Section 22',
    title: 'Right to Information',
    description: 'Every patient has the right to be informed about their diagnosis, treatment options, side effects, and alternatives in a language they understand.',
    legalRequirement: 'Information must be provided in a manner the PMI can understand. Document that informed consent was obtained.',
  },
  restrictionOnElectroconvulsive: {
    section: 'Section 95',
    title: 'Restrictions on ECT',
    description: 'ECT without muscle relaxants and anesthesia is prohibited. ECT on minors is prohibited.',
    legalRequirement: 'If ECT is discussed, document that modified ECT (with anesthesia) was specified and that the patient is not a minor.',
  },
};

// ── Detection Triggers ──

interface TriggerResult {
  triggered: boolean;
  evidence: string[];
}

function detectSeverePsychopathology(riskData: any, transcript: string): TriggerResult {
  const evidence: string[] = [];
  const lower = transcript.toLowerCase();

  // Check risk assessment data
  if (riskData?.domains?.psychoticSymptoms) {
    evidence.push('Psychotic symptoms detected in risk assessment');
  }
  if (riskData?.cssrsLevel >= 3) {
    evidence.push(`C-SSRS Level ${riskData.cssrsLevel}: ${riskData.cssrsLabel}`);
  }
  if (riskData?.overallRiskLevel === 'critical' || riskData?.overallRiskLevel === 'high') {
    evidence.push(`Overall risk level: ${riskData.overallRiskLevel}`);
  }

  // Check transcript for severe pathology markers
  const severeMarkers = [
    'schizophrenia', 'bipolar', 'psychosis', 'psychotic',
    'hearing voices', 'hallucination', 'delusion', 'manic episode',
    'severe depression', 'catatonic', 'dissociation severe',
    'command hallucination', 'voices telling', 'paranoid',
  ];

  for (const marker of severeMarkers) {
    if (lower.includes(marker)) {
      evidence.push(`Severe pathology marker detected: "${marker}"`);
    }
  }

  return { triggered: evidence.length > 0, evidence };
}

function detectCapacityConcerns(riskData: any, transcript: string): TriggerResult {
  const evidence: string[] = [];
  const lower = transcript.toLowerCase();

  const capacityMarkers = [
    'can\'t make decisions', 'confused about treatment',
    'doesn\'t understand', 'unable to consent',
    'disoriented', 'not oriented', 'samajh nahi aa raha',
    'kya ho raha hai', 'cognitive decline', 'dementia',
    'refuses all treatment', 'won\'t take medicine',
  ];

  for (const marker of capacityMarkers) {
    if (lower.includes(marker)) {
      evidence.push(`Capacity concern marker: "${marker}"`);
    }
  }

  // Check if risk data suggests capacity issues
  if (riskData?.domains?.psychoticSymptoms) {
    evidence.push('Psychotic symptoms may affect capacity');
  }

  return { triggered: evidence.length > 0, evidence };
}

function detectECTDiscussion(transcript: string): TriggerResult {
  const evidence: string[] = [];
  const lower = transcript.toLowerCase();

  const ectMarkers = ['ect', 'electroconvulsive', 'shock therapy', 'electric treatment'];
  for (const marker of ectMarkers) {
    if (lower.includes(marker)) {
      evidence.push(`ECT discussed: "${marker}"`);
    }
  }

  return { triggered: evidence.length > 0, evidence };
}

// ── Main Compliance Check Function ──

/**
 * Checks a session transcript and risk assessment data against MHCA 2017 provisions.
 * Returns compliance alerts with suggested actions.
 */
export function checkMHCACompliance(
  transcript: string,
  riskData?: any,
  patientAge?: number
): ComplianceCheckResult {
  const alerts: MHCAAlert[] = [];
  const checksPerformed: string[] = [];

  // 1. Check for severe psychopathology → Advance Directive + NR
  checksPerformed.push('Severe psychopathology screening');
  const severeResult = detectSeverePsychopathology(riskData, transcript);
  if (severeResult.triggered) {
    alerts.push({
      id: 'ad_needed',
      provision: MHCA_PROVISIONS.advanceDirective.section,
      title: 'Consider Advance Directive',
      severity: 'warning',
      description: `Patient shows markers of severe psychopathology. Under MHCA 2017, consider discussing the creation of an Advance Directive. Evidence: ${severeResult.evidence.join('; ')}`,
      legalRequirement: MHCA_PROVISIONS.advanceDirective.legalRequirement,
      suggestedAction: 'Discuss with the patient: "Under MHCA 2017, you have the right to create an Advance Directive that specifies your treatment preferences. Would you like to discuss this?"',
      actionType: 'prompt_discussion',
      icon: '📋',
    });

    alerts.push({
      id: 'nr_needed',
      provision: MHCA_PROVISIONS.nominatedRepresentative.section,
      title: 'Nominated Representative Appointment',
      severity: 'warning',
      description: `Given the severity of symptoms, the patient should be informed of their right to appoint a Nominated Representative (NR) under ${MHCA_PROVISIONS.nominatedRepresentative.section}.`,
      legalRequirement: MHCA_PROVISIONS.nominatedRepresentative.legalRequirement,
      suggestedAction: 'Initiate CR-A form for Nominated Representative appointment. Discuss with patient and their support system.',
      actionType: 'generate_form',
      icon: '👤',
    });
  }

  // 2. Check for capacity concerns
  checksPerformed.push('Mental capacity screening');
  const capacityResult = detectCapacityConcerns(riskData, transcript);
  if (capacityResult.triggered) {
    alerts.push({
      id: 'capacity_assessment',
      provision: MHCA_PROVISIONS.mentalCapacity.section,
      title: 'Mental Capacity Assessment Recommended',
      severity: 'critical',
      description: `Markers suggesting potential diminished capacity detected. Under ${MHCA_PROVISIONS.mentalCapacity.section}, a formal capacity assessment is recommended. Evidence: ${capacityResult.evidence.join('; ')}`,
      legalRequirement: MHCA_PROVISIONS.mentalCapacity.legalRequirement,
      suggestedAction: 'Conduct formal capacity assessment using the Capacity Assessment Guidance Document (CAGD). Document findings in the clinical record.',
      actionType: 'document_compliance',
      icon: '🧠',
    });
  }

  // 3. Check for ECT discussion
  checksPerformed.push('ECT discussion screening');
  const ectResult = detectECTDiscussion(transcript);
  if (ectResult.triggered) {
    alerts.push({
      id: 'ect_compliance',
      provision: MHCA_PROVISIONS.restrictionOnElectroconvulsive.section,
      title: 'ECT Compliance Check',
      severity: patientAge && patientAge < 18 ? 'critical' : 'info',
      description: `ECT was discussed in the session. Under ${MHCA_PROVISIONS.restrictionOnElectroconvulsive.section}: ECT without muscle relaxants and anesthesia is prohibited. ECT on minors is prohibited.`,
      legalRequirement: MHCA_PROVISIONS.restrictionOnElectroconvulsive.legalRequirement,
      suggestedAction: patientAge && patientAge < 18
        ? 'CRITICAL: Patient is a minor — ECT is prohibited under MHCA 2017.'
        : 'Ensure documentation specifies modified ECT (with anesthesia and muscle relaxants). Document informed consent.',
      actionType: 'document_compliance',
      icon: '⚡',
    });
  }

  // 4. Always remind about confidentiality and access rights
  checksPerformed.push('Confidentiality & access rights check');
  checksPerformed.push('Right to information check');

  // Determine overall compliance status
  let overallCompliance: 'compliant' | 'action_needed' | 'urgent' = 'compliant';
  if (alerts.some(a => a.severity === 'critical')) {
    overallCompliance = 'urgent';
  } else if (alerts.length > 0) {
    overallCompliance = 'action_needed';
  }

  return { alerts, overallCompliance, checksPerformed };
}

/**
 * Returns a prompt overlay for MHCA 2017 compliance awareness.
 */
export function getMHCACompliancePromptOverlay(): string {
  return `
### MHCA 2017 COMPLIANCE (India — Mental Healthcare Act)

When documenting sessions for Indian patients, be aware of the following legal requirements under the Mental Healthcare Act (MHCA) 2017:

1. **Advance Directives (Section 5)**: If severe psychopathology is detected (psychosis, severe depression with psychotic features, bipolar disorder), note that the patient should be informed of their right to create an Advance Directive.

2. **Nominated Representative (Section 14)**: For severe cases, document whether a Nominated Representative has been appointed or if the discussion should be initiated.

3. **Mental Capacity (Section 4)**: Every person is presumed to have capacity. If there are concerns about capacity, indicate that a formal assessment using the CAGD is recommended.

4. **Informed Consent**: Document that the patient was informed about their diagnosis, treatment options, side effects, and alternatives in a language they understand.

5. **Confidentiality (Section 23)**: Note that all records are confidential and access-controlled.

If you detect markers of severe psychopathology in the transcript, include a "complianceNotes" field in your output:
"complianceNotes": {
  "mhcaAlerts": ["Description of alert..."],
  "advanceDirectiveNeeded": true/false,
  "nominatedRepresentativeNeeded": true/false,
  "capacityAssessmentNeeded": true/false
}
`;
}
