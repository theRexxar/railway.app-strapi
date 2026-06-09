// @ts-nocheck
const cloudinary = require('cloudinary');

interface PdfFile {
  id: number;
  name: string;
  hash: string;
  ext: string;
  mime: string;
  url: string;
  provider_metadata?: {
    public_id?: string;
    resource_type?: string;
  };
}

interface CheckResult {
  id: number;
  name: string;
  url: string;
  public_id: string | null;
  resource_type: string;
  corrupted: boolean;
  accessible: boolean;
  status: number;
  statusText: string;
}

function isCorrupted(file: PdfFile): boolean {
  return file.provider_metadata?.resource_type === 'image';
}

async function headCheck(url: string): Promise<{ accessible: boolean; status: number; statusText: string }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const resp = await fetch(url, { method: 'HEAD', signal: controller.signal, redirect: 'follow' });
    clearTimeout(timeout);
    return { accessible: resp.ok, status: resp.status, statusText: resp.statusText };
  } catch (err: any) {
    return { accessible: false, status: 0, statusText: err.message || 'Unknown error' };
  }
}

async function checkFile(file: PdfFile): Promise<CheckResult> {
  const { accessible, status, statusText } = await headCheck(file.url);
  const resourceType = file.provider_metadata?.resource_type || 'unknown';
  return {
    id: file.id,
    name: file.name,
    url: file.url,
    public_id: file.provider_metadata?.public_id || null,
    resource_type: resourceType,
    corrupted: isCorrupted(file),
    accessible,
    status,
    statusText,
  };
}

async function deleteFiles(strapi: any, files: CheckResult[]) {
  console.log('\n┌─────────────────────────────────');
  console.log('│ Deleting inaccessible PDFs');
  console.log('└─────────────────────────────────\n');

  let deleted = 0;
  for (const file of files) {
    const resourceType = file.resource_type !== 'unknown' ? file.resource_type : 'raw';
    try {
      if (file.public_id) {
        console.log(`  Cloudinary: ${file.public_id} (${resourceType})`);
        const result = await cloudinary.v2.uploader.destroy(file.public_id, {
          resource_type: resourceType,
        });
        if (result.result === 'ok' || result.result === 'not found') {
          console.log(`    Cloudinary: ${result.result}`);
        } else {
          console.log(`    Cloudinary: ${result.result} (unexpected)`);
        }
      }

      console.log(`  Strapi DB: ID ${file.id}`);
      const uploadSvc = strapi.plugin('upload')?.service('upload');
      if (uploadSvc) {
        const dbFile = await strapi.db.query('plugin::upload.file').findOne({ where: { id: file.id } });
        if (dbFile) {
          await uploadSvc.remove(dbFile);
        }
      } else {
        await strapi.db.query('plugin::upload.file').delete({ where: { id: file.id } });
      }
      console.log(`  ✅ ${file.name}\n`);
      deleted++;
    } catch (err: any) {
      console.log(`  ❌ ${file.name}: ${err.message}\n`);
    }
  }
  console.log(`Deleted ${deleted}/${files.length} files.`);
}

async function downloadFromCloudinary(publicId: string, resourceType: string): Promise<Buffer> {
  const url = cloudinary.v2.url(publicId, {
    resource_type: resourceType,
    sign_url: true,
    type: 'authenticated',
  });

  let resp = await fetch(url);
  if (!resp.ok) {
    const altUrl = cloudinary.v2.url(publicId, {
      resource_type: resourceType,
      sign_url: true,
      type: 'upload',
    });
    resp = await fetch(altUrl);
  }

  if (!resp.ok) {
    throw new Error(`Download failed: ${resp.status} ${resp.statusText}`);
  }

  const arrayBuf = await resp.arrayBuffer();
  return Buffer.from(arrayBuf);
}

async function uploadPublicPdf(buffer: Buffer, publicId: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.v2.uploader.upload_stream(
      {
        resource_type: 'raw',
        type: 'upload',
        access_mode: 'public',
        public_id: publicId,
      },
      (err: any, result: any) => {
        if (err) reject(err);
        else resolve(result);
      }
    );
    stream.end(buffer);
  });
}

async function fixFiles(strapi: any, files: CheckResult[]) {
  console.log('\n┌─────────────────────────────────');
  console.log('│ Fixing inaccessible PDFs');
  console.log('└─────────────────────────────────\n');

  let fixed = 0;
  for (const file of files) {
    try {
      if (!file.public_id) {
        console.log(`  ⚠️  ${file.name}: no public_id, skipping\n`);
        continue;
      }

      if (file.corrupted) {
        console.log(`  ⚠️  ${file.name}: corrupted (uploaded as image). Delete + re-upload original file.\n`);
        continue;
      }

      console.log(`  ${file.name} (${file.public_id})`);

      const resourceType = file.resource_type !== 'unknown' ? file.resource_type : 'raw';

      console.log(`    Downloading...`);
      const buffer = await downloadFromCloudinary(file.public_id, resourceType);
      console.log(`    ${buffer.length} bytes`);

      const magic = buffer.slice(0, 5).toString('utf-8');
      console.log(`    Magic bytes: ${magic}${magic === '%PDF-' ? ' ✅' : ' ❌ (corrupted!)'}`);

      console.log(`    Deleting old resource...`);
      await cloudinary.v2.uploader.destroy(file.public_id, {
        resource_type: resourceType,
        type: 'authenticated',
      }).catch(() => {
        return cloudinary.v2.uploader.destroy(file.public_id, {
          resource_type: resourceType,
        });
      });

      console.log(`    Re-uploading as public raw...`);
      const uploadResult = await uploadPublicPdf(buffer, file.public_id);

      console.log(`    Updating Strapi record...`);
      await strapi.db.query('plugin::upload.file').update({
        where: { id: file.id },
        data: {
          url: uploadResult.secure_url,
          provider_metadata: {
            public_id: uploadResult.public_id,
            resource_type: uploadResult.resource_type,
          },
        },
      });

      console.log(`    New URL: ${uploadResult.secure_url}`);
      console.log(`  ✅ Fixed: ${file.name}\n`);
      fixed++;
    } catch (err: any) {
      console.log(`  ❌ ${file.name}: ${err.message}\n`);
    }
  }
  console.log(`Fixed ${fixed}/${files.length} files.`);
}

export async function fixCloudinaryPdfs(strapi: any, mode: string) {
  cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET,
  });

  const files: PdfFile[] = await strapi.db.query('plugin::upload.file').findMany({
    where: { ext: '.pdf' },
  });

  console.log(`\n┌─────────────────────────────────`);
  console.log(`│ Cloudinary PDF Check`);
  console.log(`├─────────────────────────────────`);
  console.log(`│ Total files found: ${files.length}`);
  console.log(`│ Mode: ${mode}`);
  console.log(`└─────────────────────────────────\n`);

  if (files.length === 0) {
    console.log('No PDF files found. Nothing to do.');
    return;
  }

  const results = await Promise.all(files.map(checkFile));
  const ok = results.filter((r) => r.accessible);
  const bad = results.filter((r) => !r.accessible);

  console.log(`✅ Accessible: ${ok.length}`);
  console.log(`❌ Inaccessible: ${bad.length}`);

  if (bad.length > 0) {
    console.log('\nInaccessible files:');
    for (const r of bad) {
      console.log(`  - [${r.status}] ${r.name} (type: ${r.resource_type}${r.corrupted ? ', corrupted' : ''}, public_id: ${r.public_id})`);
    }
    console.log();
  }

  if (mode === 'list') return;

  if (bad.length === 0) {
    console.log('All files accessible. Nothing to fix.');
    return;
  }

  if (mode === 'delete') {
    await deleteFiles(strapi, bad);
    return;
  }

  if (mode === 'fix') {
    await fixFiles(strapi, bad);
    return;
  }

  console.log(`Unknown mode: "${mode}". Valid: list, delete, fix`);
}
