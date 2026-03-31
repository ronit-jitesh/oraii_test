// =============================================
// Micro-Skills Analyzer & Supervision Engine
// Quantifies therapeutic communication quality
// Based on MI Fidelity coding standards
// =============================================

export interface MicroSkillMetrics {
  talkToListenRatio: {
    therapistPercentage: number;
    clientPercentage: number;
    benchmark: string;
    rating: 'excellent' | 'good' | 'needs_improvement' | 'concern';
  };
  openEndedQuestions: {
    percentage: number;
    count: number;
    totalQuestions: number;
    benchmark: string;
    rating: 'excellent' | 'good' | 'needs_improvement' | 'concern';
  };
  reflections: {
    percentage: number;
    count: number;
    complexReflections: number;
    simpleReflections: number;
    reflectionToQuestionRatio: number;
    benchmark: string;
    rating: 'excellent' | 'good' | 'needs_improvement' | 'concern';
  };
  firstPersonPronouns: {
    therapistICount: number;
    therapistWordCount: number;
    percentage: number;
    benchmark: string;
    rating: 'excellent' | 'good' | 'needs_improvement' | 'concern';
  };
  empathyScore: {
    score: number;   // 1-5
    benchmark: string;
    rating: 'excellent' | 'good' | 'needs_improvement' | 'concern';
  };
  miFidelityScore: {
    overall: number; // 0-100
    components: {
      empathy: number;
      evocation: number;
      collaboration: number;
      autonomySupport: number;
    };
    passingBenchmarks: string[];
    failingBenchmarks: string[];
  };
}

export interface SupervisionSummary {
  strengths: string[];
  areasForImprovement: string[];
  actionItems: string[];
  overallAssessment: string;
}

export interface SupervisionAnalysis {
  metrics: MicroSkillMetrics;
  summary: SupervisionSummary;
  sessionDuration: number; // estimated minutes
}

// ── Helper: Split transcript into speaker segments ──

interface SpeakerSegment {
  speaker: string;
  text: string;
}

function parseTranscriptSegments(transcript: string): SpeakerSegment[] {
  const segments: SpeakerSegment[] = [];
  const lines = transcript.split('\n');

  let currentSpeaker = '';
  let currentText = '';

  for (const line of lines) {
    const speakerMatch = line.match(/^(Speaker\s*\d+|Doctor|Patient|Therapist|Client)\s*[:：]/i);
    if (speakerMatch) {
      if (currentSpeaker && currentText.trim()) {
        segments.push({ speaker: currentSpeaker, text: currentText.trim() });
      }
      currentSpeaker = speakerMatch[1];
      currentText = line.replace(speakerMatch[0], '').trim();
    } else {
      currentText += ' ' + line.trim();
    }
  }

  if (currentSpeaker && currentText.trim()) {
    segments.push({ speaker: currentSpeaker, text: currentText.trim() });
  }

  return segments;
}

// ── Analysis Functions ──

function countWords(text: string): number {
  return text.split(/\s+/).filter(w => w.length > 0).length;
}

function isQuestion(text: string): boolean {
  return text.trim().endsWith('?') || /\b(what|how|why|when|where|who|can you|could you|tell me|describe)\b/i.test(text);
}

function isOpenEndedQuestion(text: string): boolean {
  if (!isQuestion(text)) return false;
  // Closed-ended patterns
  const closedPatterns = [
    /^(do|did|is|are|was|were|have|has|had|can|could|will|would|shall|should)\s/i,
    /\b(yes or no|right\?|correct\?|okay\?|isn't it|don't you|haven't you)\b/i,
  ];
  for (const pattern of closedPatterns) {
    if (pattern.test(text.trim())) return false;
  }
  // Open-ended patterns
  const openPatterns = [
    /^(what|how|why|tell me|describe|explain|share|help me understand|walk me through|in what way)/i,
    /\b(what does that|how does that|what was that like|how do you feel|what are your thoughts)\b/i,
  ];
  return openPatterns.some(p => p.test(text.trim()));
}

function isReflection(text: string): boolean {
  const reflectionPatterns = [
    /^(so |it sounds like |it seems like |you're (saying|feeling|describing)|what I('m| am) hearing|you feel |you mentioned |in other words)/i,
    /\b(must (be|feel|have been)|that sounds|I can (see|hear|imagine|understand)|it must be)\b/i,
  ];
  return reflectionPatterns.some(p => p.test(text.trim()));
}

function isComplexReflection(text: string): boolean {
  if (!isReflection(text)) return false;
  const complexPatterns = [
    /\b(underneath|deeper|what you're really|core of|at the heart of|fundamental|pattern|meaning behind)\b/i,
    /\b(on one hand.+on the other|both.+and|ambivalen|torn between|part of you)\b/i,
    /\b(it's as if|almost as though|I wonder if|could it be that)\b/i,
  ];
  return complexPatterns.some(p => p.test(text));
}

function countFirstPersonPronouns(text: string): number {
  const matches = text.match(/\b(I|me|my|mine|myself)\b/gi);
  return matches ? matches.length : 0;
}

// ── Main Analysis Function ──

/**
 * Analyzes a session transcript for therapist micro-skills.
 * Returns quantified metrics with benchmarks and supervision summary.
 */
export function analyzeSessionMicroSkills(
  transcript: string,
  roleAnalysis?: { speaker0Role: string; speaker1Role: string }
): SupervisionAnalysis {
  const segments = parseTranscriptSegments(transcript);

  // Identify therapist vs client segments
  const therapistLabels = ['doctor', 'therapist', 'speaker 0'];
  const clientLabels = ['patient', 'client', 'speaker 1'];

  // Use role analysis if available
  if (roleAnalysis) {
    if (roleAnalysis.speaker0Role?.toLowerCase() === 'doctor') {
      // Speaker 0 is therapist
    } else {
      // Swap labels
      therapistLabels.push('speaker 1');
      clientLabels.push('speaker 0');
    }
  }

  const isTherapist = (speaker: string) =>
    therapistLabels.some(l => speaker.toLowerCase().includes(l));

  const therapistSegments = segments.filter(s => isTherapist(s.speaker));
  const clientSegments = segments.filter(s => !isTherapist(s.speaker));

  const therapistText = therapistSegments.map(s => s.text).join(' ');
  const clientText = clientSegments.map(s => s.text).join(' ');
  const therapistWords = countWords(therapistText);
  const clientWords = countWords(clientText);
  const totalWords = therapistWords + clientWords;

  // 1. Talk-to-Listen Ratio
  const therapistPct = totalWords > 0 ? (therapistWords / totalWords) * 100 : 50;
  const clientPct = 100 - therapistPct;
  const talkRating: MicroSkillMetrics['talkToListenRatio']['rating'] =
    clientPct >= 65 ? 'excellent' :
    clientPct >= 55 ? 'good' :
    clientPct >= 45 ? 'needs_improvement' : 'concern';

  // 2. Open-ended Questions
  const therapistUtterances = therapistSegments.map(s => s.text);
  const allQuestions = therapistUtterances.filter(isQuestion);
  const openQuestions = therapistUtterances.filter(isOpenEndedQuestion);
  const openPct = therapistUtterances.length > 0
    ? (openQuestions.length / therapistUtterances.length) * 100
    : 0;
  const openRating: MicroSkillMetrics['openEndedQuestions']['rating'] =
    openPct >= 5 ? 'excellent' :
    openPct >= 3 ? 'good' :
    openPct >= 1.5 ? 'needs_improvement' : 'concern';

  // 3. Reflections
  const reflections = therapistUtterances.filter(isReflection);
  const complexRefs = therapistUtterances.filter(isComplexReflection);
  const simpleRefs = reflections.length - complexRefs.length;
  const reflPct = therapistUtterances.length > 0
    ? (reflections.length / therapistUtterances.length) * 100
    : 0;
  const refToQRatio = allQuestions.length > 0
    ? reflections.length / allQuestions.length
    : 0;
  const reflRating: MicroSkillMetrics['reflections']['rating'] =
    reflPct >= 15 ? 'excellent' :
    reflPct >= 10 ? 'good' :
    reflPct >= 5 ? 'needs_improvement' : 'concern';

  // 4. First-Person Pronouns
  const iPronounCount = countFirstPersonPronouns(therapistText);
  const iPct = therapistWords > 0 ? (iPronounCount / therapistWords) * 100 : 0;
  const iRating: MicroSkillMetrics['firstPersonPronouns']['rating'] =
    iPct <= 2 ? 'excellent' :
    iPct <= 4 ? 'good' :
    iPct <= 6 ? 'needs_improvement' : 'concern';

  // 5. Empathy Score (estimated from reflections + complex reflections)
  const empathyRaw = Math.min(5, 1 + (reflPct / 5) + (complexRefs.length * 0.5));
  const empathyScore = Math.round(empathyRaw * 10) / 10;
  const empathyRating: MicroSkillMetrics['empathyScore']['rating'] =
    empathyScore >= 4 ? 'excellent' :
    empathyScore >= 3 ? 'good' :
    empathyScore >= 2 ? 'needs_improvement' : 'concern';

  // 6. MI Fidelity Score
  const empathyComponent = Math.round(empathyScore * 20); // 0-100
  const evocationComponent = Math.round(Math.min(100, openPct * 15));
  const collaborationComponent = Math.round(Math.min(100, clientPct * 1.5));
  const autonomyComponent = Math.round(Math.min(100, (100 - iPct) * 1.2));
  const overallFidelity = Math.round(
    (empathyComponent * 0.3 + evocationComponent * 0.25 +
     collaborationComponent * 0.25 + autonomyComponent * 0.2)
  );

  const passingBenchmarks: string[] = [];
  const failingBenchmarks: string[] = [];

  if (empathyComponent >= 60) passingBenchmarks.push('Empathy ≥ 3.0/5');
  else failingBenchmarks.push('Empathy below 3.0/5');

  if (evocationComponent >= 50) passingBenchmarks.push('Open questions ≥ 3.3%');
  else failingBenchmarks.push('Open questions below 3.3%');

  if (collaborationComponent >= 60) passingBenchmarks.push('Client speech ≥ 60%');
  else failingBenchmarks.push('Client speech below 60%');

  if (refToQRatio >= 1) passingBenchmarks.push('Reflection-to-question ratio ≥ 1:1');
  else failingBenchmarks.push('Reflection-to-question ratio below 1:1');

  // Estimated session duration (rough: ~150 words/min for dialogue)
  const estimatedMinutes = Math.round(totalWords / 150);

  // Build metrics
  const metrics: MicroSkillMetrics = {
    talkToListenRatio: {
      therapistPercentage: Math.round(therapistPct),
      clientPercentage: Math.round(clientPct),
      benchmark: 'Client should dominate (60-70% client speech)',
      rating: talkRating,
    },
    openEndedQuestions: {
      percentage: Math.round(openPct * 10) / 10,
      count: openQuestions.length,
      totalQuestions: allQuestions.length,
      benchmark: 'Approx. 3.3% of utterances in high-fidelity sessions',
      rating: openRating,
    },
    reflections: {
      percentage: Math.round(reflPct * 10) / 10,
      count: reflections.length,
      complexReflections: complexRefs.length,
      simpleReflections: simpleRefs,
      reflectionToQuestionRatio: Math.round(refToQRatio * 100) / 100,
      benchmark: 'Approx. 12.9% of utterances; observer-rated mean 3.8/5',
      rating: reflRating,
    },
    firstPersonPronouns: {
      therapistICount: iPronounCount,
      therapistWordCount: therapistWords,
      percentage: Math.round(iPct * 10) / 10,
      benchmark: 'Lower "I" usage linked to better alliance ratings',
      rating: iRating,
    },
    empathyScore: {
      score: empathyScore,
      benchmark: 'Observer-rated mean of 3.8/5 in high-fidelity sessions',
      rating: empathyRating,
    },
    miFidelityScore: {
      overall: overallFidelity,
      components: {
        empathy: empathyComponent,
        evocation: evocationComponent,
        collaboration: collaborationComponent,
        autonomySupport: autonomyComponent,
      },
      passingBenchmarks,
      failingBenchmarks,
    },
  };

  // Generate supervision summary
  const strengths: string[] = [];
  const areasForImprovement: string[] = [];
  const actionItems: string[] = [];

  if (talkRating === 'excellent' || talkRating === 'good') {
    strengths.push('Good talk-to-listen balance — client has space to express themselves');
  } else {
    areasForImprovement.push('Consider allowing more space for client expression');
    actionItems.push('Practice pausing after questions to allow fuller client responses');
  }

  if (openRating === 'excellent' || openRating === 'good') {
    strengths.push('Effective use of open-ended questions to explore client experience');
  } else {
    areasForImprovement.push('Increase use of open-ended questions (What, How, Tell me about...)');
    actionItems.push('Replace yes/no questions with explorative prompts');
  }

  if (reflRating === 'excellent' || reflRating === 'good') {
    strengths.push('Strong reflective listening skills demonstrating empathy');
  } else {
    areasForImprovement.push('Increase reflective statements to demonstrate empathic understanding');
    actionItems.push('Practice "It sounds like..." and "What I\'m hearing is..." formulations');
  }

  if (complexRefs.length > 0) {
    strengths.push(`Used ${complexRefs.length} complex reflection(s) showing advanced active listening`);
  } else {
    areasForImprovement.push('Develop complex reflections that interpret underlying meaning');
  }

  if (iRating === 'concern') {
    areasForImprovement.push('High first-person pronoun usage may affect therapeutic alliance');
    actionItems.push('Shift focus from "I think..." to "You seem to be..." formulations');
  }

  const overallAssessment = overallFidelity >= 70
    ? 'Strong therapeutic session with good adherence to evidence-based communication practices.'
    : overallFidelity >= 50
    ? 'Adequate therapeutic session. Some areas identified for professional development.'
    : 'Session shows opportunities for growth in therapeutic communication skills. Consider supervision or additional training.';

  return {
    metrics,
    summary: {
      strengths,
      areasForImprovement,
      actionItems,
      overallAssessment,
    },
    sessionDuration: estimatedMinutes,
  };
}
