import fs from 'fs';
import path from 'path';

const API_DIR = path.resolve(__dirname, '../src/api');
const COMPONENTS_DIR = path.resolve(__dirname, '../src/components');
const OUTPUT_PATH = path.resolve(__dirname, '../public/docs/openapi.yaml');

function loadSchemas(): { apiSchemas: any[] } {
  const apiSchemas: any[] = [];

  const apiDirs = fs.readdirSync(API_DIR);
  for (const apiDir of apiDirs) {
    const schemaFile = path.join(API_DIR, apiDir, 'content-types', apiDir, 'schema.json');
    if (fs.existsSync(schemaFile)) {
      const schema = JSON.parse(fs.readFileSync(schemaFile, 'utf8'));
      apiSchemas.push({ uid: `api::${apiDir}.${apiDir}`, ...schema });
    }
  }

  return { apiSchemas };
}

function generateOpenApi() {
  const { apiSchemas } = loadSchemas();

  // Build spec as plain object, then serialize to YAML

  // Helper to write YAML manually for clean output
  const lines: string[] = [];

  function w(line: string) { lines.push(line); }
  function q(str: string): string {
    if (str === '' || /[:{}[\],&*?|>!'"%@`]/.test(str) || str === 'true' || str === 'false' || /^\d/.test(str)) {
      return '"' + str.replace(/"/g, '\\"') + '"';
    }
    return str;
  }

  w('openapi: "3.0.3"');
  w('info:');
  w('  title: JARI PMI CMS API');
  w('  description: |');
  w('    Strapi v5 CMS API for JARI PMI — a landing page providing information for Indonesian migrant workers (PMI).');
  w('');
  w('    ## Authentication');
  w('    `/api/global` and `/api/homepage` are publicly accessible without authentication (auth: false).');
  w('    All other endpoints require a Strapi API token. Create one in **Settings → API Tokens** in the admin panel.');
  w('    Paste your token in the Swagger UI "API Token" bar above.');
  w('');
  w('    ## Pagination');
  w('    List endpoints support `pagination[page]` and `pagination[pageSize]` query parameters.');
  w('    Default page size is 25. Response includes `pagination` object with `page`, `pageSize`, `pageCount`, `total`.');
  w('');
  w('    ## Filtering');
  w('    Use `filters` query parameter. Example: `?filters[is_featured][$eq]=true`');
  w('');
  w('    ## Population');
  w('    Use `populate` query parameter to include relations. Example: `?populate=article_category,author`');
  w('  version: "1.0.0"');
  w('  contact:');
  w('    name: JARI PMI Team');
  w('servers:');
  w('  - url: "https://jari-pmi.example.com/api"');
  w('    description: Production');
  w('  - url: "http://localhost:1337/api"');
  w('    description: Development');
  w('security:');
  w('  - bearerAuth: []');
  w('tags:');

  const readOnlyPaths = ['/global', '/homepage'];

  // Sort schemas by display name
  const sortedSchemas = [...apiSchemas].sort((a, b) =>
    (a.info.displayName || a.info.singularName).localeCompare(b.info.displayName || b.info.singularName)
  );

  for (const schema of sortedSchemas) {
    const displayName = schema.info.displayName || schema.info.singularName;
    const description = schema.info.description || '';
    w(`  - name: ${displayName}`);
    w(`    description: ${q(description)}`);
  }

  w('paths:');

  for (const schema of sortedSchemas) {
    const singularName = schema.info.singularName;
    const pluralName = schema.info.pluralName;
    const displayName = schema.info.displayName || singularName;
    const isSingleType = schema.kind === 'singleType';
    const apiPath = isSingleType ? `/${singularName}` : `/${pluralName}`;

    if (isSingleType) {
      const isReadOnly = readOnlyPaths.includes(apiPath);
      w(`  "${apiPath}":`);
      w(`    get:`);
      w(`      tags: [${displayName}]`);
      w(`      summary: "Get ${displayName.toLowerCase()}${isReadOnly ? ' (read-only, auth not required)' : ''}"`);
      w(`      operationId: get${singularName.charAt(0).toUpperCase() + singularName.slice(1)}`);
      w(`      responses:`);
      w(`        "200":`);
      w(`          description: OK`);
    } else {
      w(`  "${apiPath}":`);
      w(`    get:`);
      w(`      tags: [${displayName}]`);
      w(`      summary: "List all ${displayName.toLowerCase()} entries"`);
      w(`      operationId: get${singularName.charAt(0).toUpperCase() + singularName.slice(1)}s`);
      w(`      parameters:`);
      w(`        - $ref: "#/components/parameters/paginationPage"`);
      w(`        - $ref: "#/components/parameters/paginationPageSize"`);
      w(`        - $ref: "#/components/parameters/populate"`);

      // Add enum filter params
      for (const [attrName, attrDef] of Object.entries(schema.attributes || {})) {
        const attr = attrDef as any;
        if (attr.type === 'enumeration' && attr.enum) {
          w(`        - name: "filters[${attrName}][$eq]"`);
          w(`          in: query`);
          w(`          schema:`);
          w(`            type: string`);
          w(`            enum: [${attr.enum.map((e: string) => e).join(', ')}]`);
          w(`          description: "Filter by ${attrName}"`);
        }
        if (attr.type === 'boolean') {
          w(`        - name: "filters[${attrName}][$eq]"`);
          w(`          in: query`);
          w(`          schema:`);
          w(`            type: boolean`);
          w(`          description: "Filter by ${attrName}"`);
        }
      }

      w(`      responses:`);
      w(`        "200":`);
      w(`          description: OK`);

      // Detail endpoint
      w(`  "${apiPath}/{id}":`);
      w(`    get:`);
      w(`      tags: [${displayName}]`);
      w(`      summary: "Get a ${displayName.toLowerCase()} by documentId"`);
      w(`      operationId: get${singularName.charAt(0).toUpperCase() + singularName.slice(1)}`);
      w(`      parameters:`);
      w(`        - $ref: "#/components/parameters/documentId"`);
      w(`        - $ref: "#/components/parameters/populate"`);
      w(`      responses:`);
      w(`        "200":`);
      w(`          description: OK`);
    }
  }

  w('components:');
  w('  securitySchemes:');
  w('    bearerAuth:');
  w('      type: http');
  w('      scheme: bearer');
  w('      bearerFormat: JWT');
  w('      description: "Strapi API Token. Generate one in Settings → API Tokens."');
  w('  parameters:');
  w('    paginationPage:');
  w('      name: "pagination[page]"');
  w('      in: query');
  w('      schema:');
  w('        type: integer');
  w('        minimum: 1');
  w('        default: 1');
  w('      description: "Page number"');
  w('    paginationPageSize:');
  w('      name: "pagination[pageSize]"');
  w('      in: query');
  w('      schema:');
  w('        type: integer');
  w('        minimum: 1');
  w('        maximum: 100');
  w('        default: 25');
  w('      description: "Number of results per page"');
  w('    populate:');
  w('      name: populate');
  w('      in: query');
  w('      schema:');
  w('        type: string');
  w('      description: "Relations to populate, e.g. * or article_category,author"');
  w('    documentId:');
  w('      name: id');
  w('      in: path');
  w('      required: true');
  w('      schema:');
  w('        oneOf:');
  w('          - type: integer');
  w('          - type: string');
  w('      description: "Document ID or slug"');

  const outputPath = OUTPUT_PATH;
  fs.writeFileSync(outputPath, lines.join('\n') + '\n', 'utf8');
  const pathCount = Object.keys(sortedSchemas).length;
  console.log(`OpenAPI spec generated at ${outputPath}`);
  console.log(`${lines.filter(l => l.startsWith('  "/')).length} paths, ${sortedSchemas.length} content types`);
}

generateOpenApi();