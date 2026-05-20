import { NextRequest, NextResponse } from 'next/server';
import {
  withErrorHandling,
  verifyAuth,
  createSuccessResponse,
  ApiError,
} from '@/shared/lib/api/api-server';

// ---------------------------------------------------------------------------
// OpenAI GPT-4o image validation
// ---------------------------------------------------------------------------

interface OpenAIResponse {
  choices?: Array<{
    message?: { content?: string };
  }>;
  error?: { message?: string };
}

/**
 * Calls OpenAI GPT-4o (vision) to determine whether an image is a brain MRI scan.
 *
 * Returns:
 *   { isBrainMRI: true }                           — image is a brain MRI
 *   { isBrainMRI: false, description: string }     — image is something else;
 *                                                     description is shown to the user
 */
async function validateImageWithOpenAI(
  base64Image: string,
  mimeType: string,
  openaiApiKey: string,
): Promise<{ isBrainMRI: true } | { isBrainMRI: false; description: string }> {
  const payload = {
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${base64Image}`,
              detail: 'low', // low detail is sufficient for this binary classification
            },
          },
          {
            type: 'text',
            text: 'You are a medical imaging expert. Examine this image carefully.\n\nIs this a brain MRI scan?\n\n- If YES: respond with only the word YES\n- If NO: Write exactly 2 sentences. Sentence 1: describe what this image actually shows (e.g. the subject, type of content). Sentence 2: state why it is not suitable for brain dementia MRI classification.',
          },
        ],
      },
    ],
    max_tokens: 150,
    temperature: 0,
  };

  const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiApiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!openaiRes.ok) {
    const errText = await openaiRes.text().catch(() => 'unknown error');
    throw new ApiError(
      `Image validation service error (${openaiRes.status}): ${errText}`,
      503,
      'OPENAI_ERROR',
    );
  }

  const openaiData: OpenAIResponse = await openaiRes.json();

  if (openaiData.error?.message) {
    throw new ApiError(
      `OpenAI error: ${openaiData.error.message}`,
      503,
      'OPENAI_API_ERROR',
    );
  }

  const rawText = openaiData?.choices?.[0]?.message?.content?.trim() ?? '';

  // Any response that starts with YES (case-insensitive) is a brain MRI
  if (rawText.toUpperCase().startsWith('YES')) {
    return { isBrainMRI: true };
  }

  // Strip any leading "NO." prefix before showing the description in the UI
  const description = rawText
    .replace(/^NO[.,]?\s*/i, '')
    .trim() || 'This does not appear to be a brain MRI image.';

  return { isBrainMRI: false, description };
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

async function handlePOST(request: NextRequest): Promise<NextResponse> {
  // 1. Verify the caller is an authenticated doctor
  await verifyAuth('doctor');

  // 2. Parse multipart form data
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    throw new ApiError('Invalid multipart form data', 400, 'INVALID_FORM_DATA');
  }

  const file = formData.get('file') as File | null;
  if (!file) throw new ApiError('Image file is required', 400, 'MISSING_FILE');

  // 3. Validate file type and size (mirrors client-side guard)
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (!validTypes.includes(file.type)) {
    throw new ApiError(
      'Invalid file type. Please upload a JPG, PNG, or WebP image.',
      400,
      'INVALID_FILE_TYPE',
    );
  }
  if (file.size > 1 * 1024 * 1024) {
    throw new ApiError(
      'File size too large. Maximum size is 1 MB.',
      400,
      'FILE_TOO_LARGE',
    );
  }

  // 4. Load server-side env vars (never exposed to the browser)
  const openaiApiKey = process.env.OPENAI_API_KEY;
  const modalApiUrl  = process.env.MODAL_API_URL;

  if (!openaiApiKey || openaiApiKey === 'your_openai_api_key_here') {
    throw new ApiError(
      'OpenAI API key is not configured. Please set OPENAI_API_KEY in .env.local.',
      500,
      'OPENAI_NOT_CONFIGURED',
    );
  }
  if (!modalApiUrl) {
    throw new ApiError(
      'Classification service URL is not configured.',
      500,
      'MODAL_NOT_CONFIGURED',
    );
  }

  // 5. Convert image to base64 for OpenAI inline data
  const imageBuffer  = Buffer.from(await file.arrayBuffer());
  const base64Image  = imageBuffer.toString('base64');

  // 6. Validate with OpenAI GPT-4o — is it a brain MRI?
  let validation: Awaited<ReturnType<typeof validateImageWithOpenAI>>;
  try {
    validation = await validateImageWithOpenAI(base64Image, file.type, openaiApiKey);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Image validation service unavailable.', 503, 'OPENAI_UNAVAILABLE');
  }

  // 7. If GPT-4o says it's NOT a brain MRI, return 422 with the description
  if (!validation.isBrainMRI) {
    return NextResponse.json(
      {
        success: false,
        type: 'VALIDATION_REJECTED',
        description: validation.description,
      },
      { status: 422 },
    );
  }

  // 8. Valid brain MRI — forward to Modal.com for dementia classification
  const modalFormData = new FormData();
  const imageBlob     = new Blob([imageBuffer], { type: file.type });
  modalFormData.append('file', imageBlob, file.name);

  let classificationResult: Record<string, unknown>;
  try {
    const modalRes = await fetch(`${modalApiUrl}/predict`, {
      method: 'POST',
      body:   modalFormData,
    });

    if (!modalRes.ok) {
      const errText = await modalRes.text().catch(() => 'unknown error');
      throw new ApiError(
        `Classification failed (${modalRes.status}): ${errText}`,
        502,
        'CLASSIFICATION_FAILED',
      );
    }

    classificationResult = await modalRes.json();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Classification service unavailable.', 502, 'MODAL_UNAVAILABLE');
  }

  // 9. Validate Modal.com response shape
  if (
    !classificationResult.prediction ||
    classificationResult.confidence === undefined ||
    !classificationResult.all_probabilities
  ) {
    throw new ApiError(
      'Invalid response from classification service.',
      502,
      'INVALID_CLASSIFICATION_RESPONSE',
    );
  }

  return createSuccessResponse(classificationResult, 'MRI analysis complete');
}

export const POST = withErrorHandling(handlePOST);
