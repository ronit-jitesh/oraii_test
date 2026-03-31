// HuggingFace Inference API — secondary risk validation
// Models: sentinetyd/suicidality + KevSun/mentalhealth_LM

const HF_API = "https://api-inference.huggingface.co/models";

async function hfInfer(model: string, inputs: string) {
  const token = process.env.HF_API_TOKEN;
  if (!token) return null;  // Graceful fallback if token not set

  try {
    const res = await fetch(`${HF_API}/${model}`, {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${token}`, 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({ inputs: inputs.slice(-2000) }),  // 512 token limit roughly
    });
    
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error(`HF Inference Error [${model}]:`, error);
    return null;
  }
}

export async function classifySuicidality(transcript: string) {
  try {
    const result = await hfInfer("sentinetyd/suicidality", transcript);
    if (!result) return null;
    
    const top = Array.isArray(result[0]) ? result[0][0] : result[0];
    return { 
      label: (top.label as string).toUpperCase() as "SUICIDAL" | "NON_SUICIDAL", 
      score: top.score as number 
    };
  } catch { return null; }
}

export async function scoreMentalHealthSeverity(transcript: string) {
  try {
    const result = await hfInfer("KevSun/mentalhealth_LM", transcript);
    if (!result) return null;
    
    const top = Array.isArray(result[0]) ? result[0][0] : result[0];
    const severity = parseInt((top.label as string).replace("LABEL_", ""));
    return { 
      severity: isNaN(severity) ? 2 : severity, 
      confidence: top.score as number 
    };
  } catch { return null; }
}

export async function runHFRiskValidation(transcript: string, gptSeverityScore: number) {
  const [sui, sev] = await Promise.allSettled([
    classifySuicidality(transcript),
    scoreMentalHealthSeverity(transcript)
  ]);

  const suiResult = sui.status === "fulfilled" ? sui.value : null;
  const sevResult = sev.status === "fulfilled" ? sev.value : null;

  // GPT severity is 1–10; HF is 0–5 — normalize to compare
  const gptNorm = Math.round(gptSeverityScore / 2);
  const discrepancy = sevResult ? Math.abs(sevResult.severity - gptNorm) >= 2 : false;

  return {
    suicidalityFlag: suiResult?.label === "SUICIDAL",
    suicidalityConfidence: suiResult?.score ?? null,
    hfSeverity: sevResult?.severity ?? null,
    severityDiscrepancy: discrepancy,
    warningMessage: discrepancy
      ? `⚠ Risk models disagree: GPT-4o ${gptSeverityScore}/10, HF classifier ${sevResult?.severity}/5 — review manually`
      : null
  };
}
