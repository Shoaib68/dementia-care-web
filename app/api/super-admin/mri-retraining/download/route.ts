import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import {
  withErrorHandling,
  verifyAuth,
  ApiError,
} from '@/shared/lib/api/api-server';
import { getMRIScansForRetraining } from '@/features/super-admin/services/mri-retraining.service';
import { supabaseAdmin } from '@/shared/lib/supabase-admin';

// Allow up to 5 minutes for large datasets (Vercel Pro / self-hosted only)
export const maxDuration = 300;

const BUCKET_NAME = 'mri-scans';

// Map doctor_final_stage values to safe folder names
const STAGE_FOLDERS: Record<string, string> = {
  'Non Demented': 'Non_Demented',
  'Mild':         'Mild',
  'Moderate':     'Moderate',
  'Severe':       'Severe',
};

/**
 * Extract the storage object path from a Supabase Storage URL.
 * Handles both public and signed URL formats:
 *   .../storage/v1/object/public/{bucket}/{path}
 *   .../storage/v1/object/sign/{bucket}/{path}?token=...
 */
function extractStoragePath(url: string): string | null {
  try {
    const patterns = [
      `/storage/v1/object/public/${BUCKET_NAME}/`,
      `/storage/v1/object/sign/${BUCKET_NAME}/`,
      `/storage/v1/object/authenticated/${BUCKET_NAME}/`,
    ];
    for (const pattern of patterns) {
      const idx = url.indexOf(pattern);
      if (idx !== -1) {
        return decodeURIComponent(url.slice(idx + pattern.length).split('?')[0]);
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Download an image directly via the Supabase Admin storage client.
 * This uses the service role key, so it works regardless of whether
 * the bucket is public or private.
 */
async function downloadImageFromStorage(
  fileUrl: string
): Promise<ArrayBuffer | null> {
  const storagePath = extractStoragePath(fileUrl);
  if (!storagePath) return null;

  try {
    const { data: blob, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .download(storagePath);

    if (error || !blob) return null;
    return await blob.arrayBuffer();
  } catch {
    return null;
  }
}

/** Process an array of items in parallel, limiting concurrency. */
async function runWithConcurrency<T>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<void>
): Promise<void> {
  let idx = 0;
  async function worker() {
    while (idx < items.length) {
      const item = items[idx++];
      await fn(item);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
}

async function handleGET(_request: NextRequest): Promise<NextResponse> {
  await verifyAuth('super_admin');

  // ── 1. Delegate DB query to the service (same pattern as analytics/hospitals routes)
  const scansResult = await getMRIScansForRetraining();

  if (!scansResult.success) {
    throw new ApiError(
      scansResult.error || 'Failed to fetch MRI scans',
      500,
      'DB_FETCH_FAILED'
    );
  }

  const scans = scansResult.data ?? [];

  if (scans.length === 0) {
    throw new ApiError(
      'No MRI scans with doctor feedback found. Submit at least one scan first.',
      404,
      'NO_SCANS'
    );
  }

  // ── 2. Build ZIP structure ────────────────────────────────────────────────
  const zip = new JSZip();

  // Pre-create folders so they appear even if empty
  for (const folderName of Object.values(STAGE_FOLDERS)) {
    zip.folder(folderName);
  }

  let downloaded = 0;
  let skipped    = 0;

  await runWithConcurrency(scans, 8, async (scan) => {
    const folder = STAGE_FOLDERS[scan.doctor_final_stage];
    if (!folder || !scan.file_url) { skipped++; return; }

    const buffer = await downloadImageFromStorage(scan.file_url);
    if (!buffer) { skipped++; return; }

    // Build a deterministic filename: {stage}_{scanId}_{originalFilename}
    const urlFileName = decodeURIComponent(
      scan.file_url.split('/').pop()?.split('?')[0] ?? `${scan.id}.jpg`
    );
    const fileName = `${scan.id}_${urlFileName}`;

    zip.folder(folder)!.file(fileName, buffer);
    downloaded++;
  });

  if (downloaded === 0) {
    throw new ApiError(
      'Could not download any MRI images. Check Supabase Storage access.',
      500,
      'DOWNLOAD_FAILED'
    );
  }

  // ── 3. Add a manifest CSV ─────────────────────────────────────────────────
  const csvLines = [
    'scan_id,scan_date,ai_diagnosis_stage,doctor_final_stage,feedback_status,folder',
    ...scans.map((s) =>
      [
        s.id,
        s.scan_date ?? '',
        s.ai_diagnosis_stage ?? 'Non Demented',
        s.doctor_final_stage,
        s.feedback_status,
        STAGE_FOLDERS[s.doctor_final_stage] ?? 'Unknown',
      ].join(',')
    ),
  ];
  zip.file('manifest.csv', csvLines.join('\n'));

  // ── 4. Add a README ───────────────────────────────────────────────────────
  zip.file(
    'README.txt',
    [
      'MRI Retraining Dataset',
      '======================',
      `Generated: ${new Date().toISOString()}`,
      `Total scans: ${scans.length}`,
      `Downloaded: ${downloaded}  |  Skipped: ${skipped}`,
      '',
      'Folder structure:',
      '  Non_Demented/   – images where doctor confirmed / corrected to Non Demented',
      '  Mild/           – images where doctor confirmed / corrected to Mild',
      '  Moderate/       – images where doctor confirmed / corrected to Moderate',
      '  Severe/         – images where doctor confirmed / corrected to Severe',
      '',
      'All images are labelled according to the DOCTOR\'s final assessment (doctor_final_stage),',
      'not the raw AI prediction. This ensures the training data reflects verified labels.',
      '',
      'See manifest.csv for a full index of scans.',
    ].join('\n')
  );

  // ── 5. Generate ZIP buffer & respond ─────────────────────────────────────
  const zipBuffer = await zip.generateAsync({
    type:               'nodebuffer',
    compression:        'DEFLATE',
    compressionOptions: { level: 6 },
  });

  const date     = new Date().toISOString().split('T')[0];
  const filename = `mri_retraining_dataset_${date}.zip`;

  return new NextResponse(zipBuffer, {
    status: 200,
    headers: {
      'Content-Type':        'application/zip',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length':      String(zipBuffer.byteLength),
      'X-Scans-Downloaded':  String(downloaded),
      'X-Scans-Skipped':     String(skipped),
    },
  });
}

export const GET = withErrorHandling(handleGET);
