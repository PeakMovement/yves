// Client-side symptom analysis with red flag detection

interface RedFlagKeyword {
  keyword: string;
  severity: number; // 1-10
  profession: 'physiotherapy' | 'biokineticist' | 'chiropractic';
  description: string;
}

const RED_FLAG_KEYWORDS: RedFlagKeyword[] = [
  // High severity red flags (7-10)
  { keyword: 'sudden', severity: 8, profession: 'physiotherapy', description: 'Sudden onset' },
  { keyword: 'severe', severity: 9, profession: 'physiotherapy', description: 'Severe pain' },
  { keyword: 'unable to move', severity: 9, profession: 'physiotherapy', description: 'Loss of mobility' },
  { keyword: 'paralysis', severity: 10, profession: 'physiotherapy', description: 'Paralysis' },
  { keyword: 'numbness', severity: 8, profession: 'physiotherapy', description: 'Numbness' },
  { keyword: 'tingling', severity: 7, profession: 'physiotherapy', description: 'Tingling/pins and needles' },

  // Medium severity (5-6)
  { keyword: 'pain', severity: 5, profession: 'physiotherapy', description: 'Pain' },
  { keyword: 'sharp', severity: 6, profession: 'physiotherapy', description: 'Sharp pain' },
  { keyword: 'weakness', severity: 6, profession: 'physiotherapy', description: 'Muscle weakness' },
  { keyword: 'stiff', severity: 5, profession: 'physiotherapy', description: 'Stiffness' },
  { keyword: 'ache', severity: 4, profession: 'physiotherapy', description: 'Aching pain' },

  // Low severity (3-4)
  { keyword: 'discomfort', severity: 3, profession: 'physiotherapy', description: 'Discomfort' },
  { keyword: 'sore', severity: 4, profession: 'physiotherapy', description: 'Soreness' },
];

export interface SymptomAnalysisResult {
  red_flag_detected: boolean;
  confidence_score: number;
  suggested_next_step: string;
  matched_keywords?: string[];
}

export function analyzeSymptomLocal(symptomPrompt: string): SymptomAnalysisResult {
  const normalizedPrompt = symptomPrompt.toLowerCase();
  const matchedKeywords: string[] = [];
  let highestSeverity = 0;

  // Check each keyword
  for (const item of RED_FLAG_KEYWORDS) {
    if (normalizedPrompt.includes(item.keyword)) {
      matchedKeywords.push(item.keyword);
      if (item.severity > highestSeverity) {
        highestSeverity = item.severity;
      }
    }
  }

  // Determine red flag (severity 6+ = red flag)
  const redFlagDetected = highestSeverity >= 6;
  const confidenceScore = Math.min(100, highestSeverity * 10);

  const suggestedNextStep = redFlagDetected
    ? 'Go see your assigned professional'
    : 'Continue monitoring your symptoms and perform recommended exercises';

  return {
    red_flag_detected: redFlagDetected,
    confidence_score: Math.round(confidenceScore),
    suggested_next_step: suggestedNextStep,
    matched_keywords: matchedKeywords,
  };
}
