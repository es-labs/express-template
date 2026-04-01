#!/usr/bin/env node
// scripts/generate-openapi.js
//
// Generates an individual openapi.yaml for each microservice,
// then merges all three into a single docs/openapi/openapi.merged.yaml
// that is served by the API Gateway's Swagger UI.
//
// Usage:
//   node scripts/generate-openapi.js           # generates all
//   node scripts/generate-openapi.js auth      # generates auth only

import swaggerJsdoc from 'swagger-jsdoc';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import base from '../docs/openapi/base.definition.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, '..');

const SERVICES = [
  {
    name:  'auth-service',
    title: 'Auth Service API',
    description: 'User registration and JWT-based authentication.',
    version: require('../services/auth-service/package.json').version,
    apis:  ['./services/auth-service/src/routes/*.js'],
    port:  3001,
  },
  {
    name:  'payment-service',
    title: 'Payment Service API',
    description: 'Payment creation, listing, and retrieval.',
    version: require('../services/payment-service/package.json').version,
    apis:  ['./services/payment-service/src/routes/*.js'],
    port:  3002,
  },
  {
    name:  'notification-service',
    title: 'Notification Service API',
    description: 'Send and retrieve email, SMS, and push notifications.',
    version: require('../services/notification-service/package.json').version,
    apis:  ['./services/notification-service/src/routes/*.js'],
    port:  3003,
  },
];

// Filter to a specific service if argument supplied
const filter = process.argv[2];
const targets = filter
  ? SERVICES.filter(s => s.name.startsWith(filter))
  : SERVICES;

if (!targets.length) {
  console.error(`No service matching "${filter}". Available: ${SERVICES.map(s => s.name).join(', ')}`);
  process.exit(1);
}

// Track all generated specs for merging
const allSpecs = [];

for (const svc of targets) {
  console.log(`\n📄 Generating OpenAPI spec for ${svc.name}...`);

  const options = {
    definition: {
      ...base,
      info: {
        ...base.info,
        title:       svc.title,
        description: svc.description,
        version:     svc.version,
      },
      servers: [
        { url: `http://localhost:${svc.port}`, description: `Local — ${svc.name} direct` },
        { url: `http://localhost:8080`,        description: 'Local — via API Gateway' },
        { url: `https://api.example.com`,      description: 'Production — via API Gateway' },
      ],
    },
    apis: svc.apis,
  };

  let spec;
  try {
    spec = swaggerJsdoc(options);
  } catch (err) {
    console.error(`  ❌ Failed to generate spec: ${err.message}`);
    process.exit(1);
  }

  // Write individual YAML to services/<name>/docs/openapi.yaml
  const serviceDocPath = path.join(ROOT, 'services', svc.name, 'docs', 'openapi.yaml');
  fs.writeFileSync(serviceDocPath, yaml.dump(spec, { lineWidth: 120 }));
  console.log(`  ✅ Written to ${path.relative(ROOT, serviceDocPath)}`);

  allSpecs.push(spec);
}

// Merge all specs into one combined document
if (!filter && allSpecs.length > 1) {
  console.log('\n🔀 Merging all specs into docs/openapi/openapi.merged.yaml...');

  const merged = {
    ...base,
    info: { ...base.info, title: 'Microservices — Merged API', version: '1.0.0' },
    paths:      {},
    components: JSON.parse(JSON.stringify(base.components)), // deep clone
    tags:       [],
  };

  for (const spec of allSpecs) {
    // Merge paths
    Object.assign(merged.paths, spec.paths ?? {});

    // Merge schemas
    Object.assign(merged.components.schemas,   spec.components?.schemas   ?? {});
    Object.assign(merged.components.responses,  spec.components?.responses  ?? {});

    // Merge tags (deduplicate by name)
    for (const tag of (spec.tags ?? [])) {
      if (!merged.tags.find(t => t.name === tag.name)) merged.tags.push(tag);
    }
  }

  const mergedPath = path.join(ROOT, 'docs', 'openapi', 'openapi.merged.yaml');
  fs.writeFileSync(mergedPath, yaml.dump(merged, { lineWidth: 120 }));
  console.log(`  ✅ Written to ${path.relative(ROOT, mergedPath)}`);
}

console.log('\n🎉 OpenAPI generation complete.\n');
