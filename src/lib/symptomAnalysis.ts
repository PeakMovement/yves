// Symptom red flag database with scores and recommended actions
// Based on evidence-based clinical guidelines

export interface SymptomEntry {
  symptom: string;
  score: number; // 1-10
  output: 'Refer' | "Don't refer";
  actionMessage: string;
}

export const SYMPTOM_DATABASE: SymptomEntry[] = [
  // Emergency symptoms (score 9-10)
  {
    symptom: 'severe chest pain or pressure',
    score: 10,
    output: 'Refer',
    actionMessage: 'Call emergency services immediately',
  },
  {
    symptom: 'sudden loss of sensation in a limb',
    score: 10,
    output: 'Refer',
    actionMessage: 'Call emergency services immediately',
  },
  {
    symptom: 'sudden weakness on one side of body',
    score: 10,
    output: 'Refer',
    actionMessage: 'Call emergency services — possible stroke',
  },
  {
    symptom: 'difficulty speaking or slurred speech',
    score: 10,
    output: 'Refer',
    actionMessage: 'Call emergency services — possible stroke',
  },
  {
    symptom: 'loss of bladder or bowel control',
    score: 10,
    output: 'Refer',
    actionMessage: 'Emergency assessment required',
  },
  {
    symptom: 'saddle numbness',
    score: 10,
    output: 'Refer',
    actionMessage: 'Emergency assessment required',
  },
  {
    symptom: 'worst headache of your life',
    score: 9,
    output: 'Refer',
    actionMessage: 'Emergency assessment required',
  },
  {
    symptom: 'neck pain after trauma with neurological signs',
    score: 9,
    output: 'Refer',
    actionMessage: 'Do not move — call emergency services',
  },
  {
    symptom: 'unable to bear weight after fall',
    score: 9,
    output: 'Refer',
    actionMessage: 'Seek emergency assessment today',
  },
  {
    symptom: 'severe burning pain radiating down both legs',
    score: 9,
    output: 'Refer',
    actionMessage: 'Seek emergency assessment today',
  },

  // Urgent symptoms (score 6-8)
  {
    symptom: 'pins and needles radiating down an arm',
    score: 7,
    output: 'Refer',
    actionMessage: 'Go see your assigned professional within 48 hours',
  },
  {
    symptom: 'pins and needles in both hands',
    score: 7,
    output: 'Refer',
    actionMessage: 'Go see your assigned professional within 48 hours',
  },
  {
    symptom: 'unable to bend neck non-traumatic',
    score: 8,
    output: 'Refer',
    actionMessage: 'Go see your assigned professional urgently',
  },
  {
    symptom: 'shooting pain below the knee',
    score: 7,
    output: 'Refer',
    actionMessage: 'Go see your assigned professional within 48 hours',
  },
  {
    symptom: 'swollen hot red single joint',
    score: 7,
    output: 'Refer',
    actionMessage: 'Go see your assigned professional today',
  },
  {
    symptom: 'unexplained weight loss with pain',
    score: 8,
    output: 'Refer',
    actionMessage: 'Go see your assigned professional urgently',
  },
  {
    symptom: 'pain that wakes you from sleep',
    score: 7,
    output: 'Refer',
    actionMessage: 'Go see your assigned professional within 48 hours',
  },
  {
    symptom: 'pain at rest that does not improve with position',
    score: 6,
    output: 'Refer',
    actionMessage: 'Go see your assigned professional within 72 hours',
  },
  {
    symptom: 'fever with joint or back pain',
    score: 7,
    output: 'Refer',
    actionMessage: 'Go see your assigned professional today',
  },
  {
    symptom: 'progressive muscle weakness over days',
    score: 7,
    output: 'Refer',
    actionMessage: 'Go see your assigned professional urgently',
  },
  {
    symptom: 'jaw pain radiating to neck and chest',
    score: 8,
    output: 'Refer',
    actionMessage: 'Seek urgent medical assessment',
  },

  // Monitor and track (score 1-5)
  {
    symptom: 'general lower back stiffness in the morning',
    score: 4,
    output: "Don't refer",
    actionMessage: 'Logged — flag if still present in 5 days',
  },
  {
    symptom: 'mild knee ache after training',
    score: 3,
    output: "Don't refer",
    actionMessage: 'Logged — consider reducing training load',
  },
  {
    symptom: 'shoulder fatigue and reduced range',
    score: 4,
    output: "Don't refer",
    actionMessage: 'Logged — monitor over next 3 sessions',
  },
  {
    symptom: 'general fatigue or low energy',
    score: 3,
    output: "Don't refer",
    actionMessage: 'Logged — tracking sleep, HRV, and load',
  },
  {
    symptom: 'muscle soreness 24–48 hrs after training',
    score: 1,
    output: "Don't refer",
    actionMessage: 'Normal recovery — continue tracking',
  },
  {
    symptom: 'tightness in hamstrings or hip flexors',
    score: 3,
    output: "Don't refer",
    actionMessage: 'Logged — flag if worsening',
  },
  {
    symptom: 'mild headache after training',
    score: 4,
    output: "Don't refer",
    actionMessage: 'Logged — flag if recurring more than twice',
  },
  {
    symptom: 'slight swelling after activity',
    score: 4,
    output: "Don't refer",
    actionMessage: 'Logged — flag if persists beyond 3 days',
  },
  {
    symptom: 'mild joint stiffness that eases with movement',
    score: 2,
    output: "Don't refer",
    actionMessage: 'Normal — continue tracking',
  },
  {
    symptom: 'general muscle ache after new exercise',
    score: 2,
    output: "Don't refer",
    actionMessage: 'Normal — continue tracking',
  },
];

export interface SymptomAnalysisResult {
  red_flag_detected: boolean;
  confidence_score: number;
  suggested_next_step: string;
  matched_symptom?: string;
  matched_score?: number;
  output?: 'Refer' | "Don't refer";
}

export function analyzeSymptomLocal(symptomPrompt: string): SymptomAnalysisResult {
  const normalizedPrompt = symptomPrompt.toLowerCase();
  const promptWords = normalizedPrompt.split(/\s+/).filter(w => w.length > 0);

  // Synonym mapping for common symptom variations
  const synonymMap: Record<string, string[]> = {
    'tingling': ['pins and needles', 'numbness', 'paresthesia'],
    'pins and needles': ['tingling', 'numbness', 'paresthesia'],
    'numbness': ['tingling', 'pins and needles', 'paresthesia'],
    'sharp': ['severe', 'shooting', 'acute'],
    'severe': ['sharp', 'intense', 'bad'],
    'shooting': ['sharp', 'radiating'],
    'radiating': ['shooting', 'down', 'along'],
    'weakness': ['weak', 'can\'t', 'unable'],
    'loss': ['lost', 'sudden loss'],
    'ache': ['pain', 'soreness'],
    'soreness': ['ache', 'sore'],
  };

  let bestMatch: SymptomEntry | null = null;
  let bestMatchConfidence = 0;

  for (const entry of SYMPTOM_DATABASE) {
    const normalizedSymptom = entry.symptom.toLowerCase();
    const symptomWords = normalizedSymptom.split(/\s+/).filter(w => w.length > 0);

    // 1. Exact substring match (highest confidence)
    if (normalizedPrompt.includes(normalizedSymptom)) {
      if (bestMatchConfidence < 100) {
        bestMatch = entry;
        bestMatchConfidence = 100;
      }
      continue;
    }

    // 2. Check if symptom is contained in prompt (high confidence)
    if (normalizedPrompt.includes(normalizedSymptom)) {
      if (bestMatchConfidence < 95) {
        bestMatch = entry;
        bestMatchConfidence = 95;
      }
      continue;
    }

    // 3. Count meaningful word matches with synonym support
    let matchingWords = 0;
    for (const symptomWord of symptomWords) {
      // Direct word match
      if (promptWords.includes(symptomWord)) {
        matchingWords++;
        continue;
      }

      // Check for synonyms
      const synonyms = synonymMap[symptomWord] || [];
      if (synonyms.some(syn => promptWords.some(pw => pw.includes(syn) || syn.includes(pw)))) {
        matchingWords++;
        continue;
      }

      // Partial match (word starts with symptom word)
      if (promptWords.some(pw => pw.startsWith(symptomWord) || symptomWord.startsWith(pw))) {
        matchingWords++;
      }
    }

    // Calculate confidence based on word match percentage
    const matchPercentage = symptomWords.length > 0 ? (matchingWords / symptomWords.length) * 100 : 0;

    // Require at least 40% of symptom words to match, or at least 2 words
    if (matchPercentage >= 40 || matchingWords >= 2) {
      if (matchPercentage > bestMatchConfidence) {
        bestMatch = entry;
        bestMatchConfidence = matchPercentage;
      }
    }
  }

  // Generate response
  if (bestMatch && bestMatchConfidence > 0) {
    const redFlagDetected = bestMatch.score >= 6;

    return {
      red_flag_detected: redFlagDetected,
      confidence_score: bestMatch.score * 10,
      suggested_next_step: bestMatch.actionMessage,
      matched_symptom: bestMatch.symptom,
      matched_score: bestMatch.score,
      output: bestMatch.output,
    };
  }

  // No match found - generic response
  return {
    red_flag_detected: false,
    confidence_score: 0,
    suggested_next_step: 'Continue monitoring your symptoms. Logged for tracking.',
    matched_symptom: undefined,
    output: "Don't refer",
  };
}
