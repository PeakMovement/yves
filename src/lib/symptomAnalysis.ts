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
    symptom: 'chest pain or pressure that is severe',
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
    symptom: 'numbness or loss of sensation in limb',
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
    symptom: 'sudden weakness on one side',
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
    symptom: 'slurred speech or difficulty speaking',
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
    symptom: 'unable to control bladder or bowel',
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
    symptom: 'numbness in saddle area',
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
    symptom: 'worst headache ever',
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
    symptom: 'neck pain after injury with numbness or weakness',
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
    symptom: 'cannot bear weight after falling',
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
  {
    symptom: 'burning pain radiating down legs',
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
    symptom: 'tingling radiating down my arm',
    score: 7,
    output: 'Refer',
    actionMessage: 'Go see your assigned professional within 48 hours',
  },
  {
    symptom: 'arm tingling with pins and needles',
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
    symptom: 'tingling in both hands',
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
    symptom: 'unable to bend neck',
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
    symptom: 'sharp shooting pain in knee',
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
    symptom: 'joint is swollen red and hot',
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
    symptom: 'weight loss without trying with pain',
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
    symptom: 'pain wakes me at night',
    score: 7,
    output: 'Refer',
    actionMessage: 'Go see your assigned professional within 48 hours',
  },
  {
    symptom: 'woken from sleep by pain',
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
    symptom: 'resting pain that does not go away',
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
    symptom: 'fever with joint pain',
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
    symptom: 'muscle weakness getting worse',
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
  {
    symptom: 'pain in jaw radiating to neck',
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
    symptom: 'morning stiffness in lower back',
    score: 4,
    output: "Don't refer",
    actionMessage: 'Logged — flag if still present in 5 days',
  },
  {
    symptom: 'stiff lower back when i wake up',
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
    symptom: 'knee ache from training',
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
    symptom: 'shoulder feels tired with limited movement',
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
    symptom: 'tired or lacking energy',
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
    symptom: 'sore muscles after training',
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
    symptom: 'tight hamstrings or hip flexors',
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
    symptom: 'headache from training',
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
    symptom: 'swelling after activity',
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
    symptom: 'joint stiffness that gets better with movement',
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
  {
    symptom: 'muscle ache from new exercise',
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

// Extract key phrases from a symptom string for better matching
function extractKeyPhrases(text: string): string[] {
  const phrases: string[] = [];
  const words = text.toLowerCase().split(/\s+/);

  // Add individual words
  phrases.push(...words);

  // Add common 2-word phrases
  for (let i = 0; i < words.length - 1; i++) {
    phrases.push(words[i] + ' ' + words[i + 1]);
  }

  // Add common 3-word phrases
  for (let i = 0; i < words.length - 2; i++) {
    phrases.push(words[i] + ' ' + words[i + 1] + ' ' + words[i + 2]);
  }

  return phrases;
}

interface MatchResult {
  entry: SymptomEntry;
  confidence: number;
  matchType: 'exact' | 'phrase' | 'word';
}

export function analyzeSymptomLocal(symptomPrompt: string): SymptomAnalysisResult {
  const normalizedPrompt = symptomPrompt.toLowerCase();
  const promptWords = normalizedPrompt.split(/\s+/).filter(w => w.length > 0);

  let bestMatch: MatchResult | null = null;

  // TIER 1: Exact phrase match (highest confidence)
  for (const entry of SYMPTOM_DATABASE) {
    const normalizedSymptom = entry.symptom.toLowerCase();

    if (normalizedPrompt.includes(normalizedSymptom) || normalizedSymptom.includes(normalizedPrompt)) {
      const match: MatchResult = {
        entry,
        confidence: 100,
        matchType: 'exact',
      };

      if (!bestMatch || match.confidence > bestMatch.confidence) {
        bestMatch = match;
      }
    }
  }

  // TIER 2: Partial phrase match (user input contains key phrases from symptom)
  if (!bestMatch) {
    for (const entry of SYMPTOM_DATABASE) {
      const symptomPhrases = extractKeyPhrases(entry.symptom);

      // Count how many symptom phrases appear in the prompt
      const matchingPhrases = symptomPhrases.filter(phrase =>
        phrase.length > 2 && normalizedPrompt.includes(phrase)
      ).length;

      // Require at least 2 matching phrases or 50% match
      if (matchingPhrases >= 2 || (matchingPhrases > 0 && matchingPhrases >= symptomPhrases.length * 0.5)) {
        const confidence = Math.min(90, (matchingPhrases / Math.max(symptomPhrases.length, 1)) * 100);

        const match: MatchResult = {
          entry,
          confidence,
          matchType: 'phrase',
        };

        if (!bestMatch || match.confidence > bestMatch.confidence) {
          bestMatch = match;
        }
      }
    }
  }

  // TIER 3: Word-based matching (fallback with synonyms and word overlap)
  if (!bestMatch) {
    const synonymMap: Record<string, string[]> = {
      'tingling': ['pins', 'needles', 'numbness', 'paresthesia'],
      'pins': ['tingling', 'needles', 'numbness'],
      'needles': ['pins', 'tingling', 'numbness'],
      'numbness': ['tingling', 'pins', 'needles'],
      'sharp': ['severe', 'shooting', 'acute'],
      'severe': ['sharp', 'intense', 'bad', 'serious'],
      'shooting': ['sharp', 'radiating', 'pain'],
      'radiating': ['shooting', 'down', 'along', 'extending'],
      'weakness': ['weak', 'cannot', 'unable'],
      'loss': ['lost', 'losing'],
      'ache': ['pain', 'soreness', 'aching'],
      'soreness': ['ache', 'sore', 'pain'],
    };

    for (const entry of SYMPTOM_DATABASE) {
      const symptomWords = entry.symptom.toLowerCase().split(/\s+/).filter(w => w.length > 0);

      let matchingWords = 0;
      for (const symptomWord of symptomWords) {
        // Direct word match
        if (promptWords.includes(symptomWord)) {
          matchingWords++;
          continue;
        }

        // Synonym match
        const synonyms = synonymMap[symptomWord] || [];
        if (synonyms.some(syn => promptWords.includes(syn))) {
          matchingWords++;
          continue;
        }

        // Partial word match
        if (promptWords.some(pw => pw.includes(symptomWord) || symptomWord.includes(pw))) {
          matchingWords++;
        }
      }

      // Require at least 40% of symptom words to match or at least 2 words
      const matchPercentage = symptomWords.length > 0 ? (matchingWords / symptomWords.length) * 100 : 0;
      if (matchPercentage >= 40 || matchingWords >= 2) {
        const match: MatchResult = {
          entry,
          confidence: Math.min(70, matchPercentage),
          matchType: 'word',
        };

        if (!bestMatch || match.confidence > bestMatch.confidence) {
          bestMatch = match;
        }
      }
    }
  }

  // Generate response
  if (bestMatch && bestMatch.confidence > 0) {
    const redFlagDetected = bestMatch.entry.score >= 6;

    return {
      red_flag_detected: redFlagDetected,
      confidence_score: bestMatch.entry.score * 10,
      suggested_next_step: bestMatch.entry.actionMessage,
      matched_symptom: bestMatch.entry.symptom,
      matched_score: bestMatch.entry.score,
      output: bestMatch.entry.output,
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
