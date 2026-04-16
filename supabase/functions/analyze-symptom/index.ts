import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseKey);

interface AnalysisRequest {
  symptom_prompt: string;
  client_id: string;
}

interface AnalysisResponse {
  red_flag_detected: boolean;
  confidence_score: number;
  suggested_next_step: string;
  matched_guidelines?: string[];
}

serve(async (req) => {
  // Only allow POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
    });
  }

  try {
    const { symptom_prompt, client_id } = (await req.json()) as AnalysisRequest;

    if (!symptom_prompt || !client_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 }
      );
    }

    // Normalize the prompt for analysis
    const normalizedPrompt = symptom_prompt.toLowerCase();

    // Get all red flag guidelines from database
    const { data: guidelines, error: guidelinesError } = await supabase
      .from("red_flag_guidelines")
      .select("*");

    if (guidelinesError) {
      throw new Error(`Failed to fetch guidelines: ${guidelinesError.message}`);
    }

    // Analyze symptom against guidelines
    const matchedGuidelines: typeof guidelines = [];
    let highestSeverity = 0;

    for (const guideline of guidelines || []) {
      // Check if keyword appears in the prompt
      if (normalizedPrompt.includes(guideline.keyword.toLowerCase())) {
        matchedGuidelines.push(guideline);
        if (guideline.severity > highestSeverity) {
          highestSeverity = guideline.severity;
        }
      }
    }

    // Determine red flag based on severity threshold
    // Severity 6+ = red flag
    const redFlagDetected = highestSeverity >= 6;
    const confidenceScore = Math.min(100, highestSeverity * 10);

    const suggestedNextStep = redFlagDetected
      ? "Go see your assigned professional"
      : "Continue monitoring your symptoms and perform recommended exercises";

    // Store the query for learning purposes (POPIA compliant: minimal data collection)
    const { error: insertError } = await supabase
      .from("symptom_queries")
      .insert({
        client_id,
        query_text: symptom_prompt,
        red_flag_detected: redFlagDetected,
        confidence_score: confidenceScore,
      });

    if (insertError) {
      console.error("Failed to store query:", insertError);
      // Don't fail the response, just log it
    }

    const response: AnalysisResponse = {
      red_flag_detected: redFlagDetected,
      confidence_score: Math.round(confidenceScore),
      suggested_next_step: suggestedNextStep,
      matched_guidelines: matchedGuidelines.map((g) => g.keyword),
    };

    return new Response(JSON.stringify(response), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error analyzing symptom:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to analyze symptom",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500 }
    );
  }
});
