// Utilitário para alternar entre modo local e Base44
// Execute este arquivo para alternar os modos

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mode = process.argv[2]; // 'local' ou 'base44'

if (!mode || !['local', 'base44'].includes(mode)) {
  console.error('❌ Uso: node scripts/toggle-mode.js [local|base44]');
  process.exit(1);
}

console.log(`🔄 Alternando para modo: ${mode.toUpperCase()}\n`);

// Arquivo entities.js
const entitiesPath = path.join(__dirname, '../src/api/entities.js');
const entitiesContent = fs.readFileSync(entitiesPath, 'utf8');

let newEntitiesContent;
if (mode === 'local') {
  newEntitiesContent = entitiesContent
    .replace(/\/\/ import \{ base44 \} from '\.\/base44Client';/, "import { base44 } from './base44Client';")
    .replace(/import \{([^}]+)\} from '\.\/localDb';/, "// LOCAL MODE\nimport {$1} from './localDb';")
    .replace(/\/\* PRODUÇÃO[\s\S]*?\*\//g, '')
    .replace(/(export const \w+ = base44\.)/g, '// $1');
  
  console.log('✅ entities.js configurado para modo LOCAL');
} else {
  newEntitiesContent = entitiesContent
    .replace(/import \{ base44 \} from '\.\/base44Client';/, "// import { base44 } from './base44Client';")
    .replace(/\/\/ LOCAL MODE\nimport \{([^}]+)\} from '\.\/localDb';/, "import {$1} from './localDb';")
    .replace(/\/\/ (export const \w+ = base44\.)/g, '$1');
  
  console.log('✅ entities.js configurado para modo BASE44');
}

fs.writeFileSync(entitiesPath, newEntitiesContent);

// Arquivo integrations.js
const integrationsPath = path.join(__dirname, '../src/api/integrations.js');
const integrationsContent = fs.readFileSync(integrationsPath, 'utf8');

let newIntegrationsContent;
if (mode === 'local') {
  newIntegrationsContent = integrationsContent
    .replace(/\/\/ import \{ base44 \} from '\.\/base44Client';/, "import { base44 } from './base44Client';")
    .replace(/\/\/ MODO DESENVOLVIMENTO: Mock das integrações/, '// LOCAL MODE: Mock das integrações');
  
  console.log('✅ integrations.js configurado para modo LOCAL');
} else {
  // Implementar troca para base44 se necessário
  console.log('✅ integrations.js mantido em modo LOCAL (mock)');
}

fs.writeFileSync(integrationsPath, newIntegrationsContent);

// Arquivo base44Client.js
const clientPath = path.join(__dirname, '../src/api/base44Client.js');
const clientContent = fs.readFileSync(clientPath, 'utf8');

let newClientContent;
if (mode === 'local') {
  newClientContent = clientContent.replace(
    /requiresAuth: true/,
    'requiresAuth: false // Modo local'
  );
  console.log('✅ base44Client.js configurado para modo LOCAL (requiresAuth: false)');
} else {
  newClientContent = clientContent.replace(
    /requiresAuth: false.*$/m,
    'requiresAuth: true'
  );
  console.log('✅ base44Client.js configurado para modo BASE44 (requiresAuth: true)');
}

fs.writeFileSync(clientPath, newClientContent);

console.log(`\n✨ Modo ${mode.toUpperCase()} ativado com sucesso!`);
console.log(`\n🚀 Execute 'npm run dev' para iniciar o servidor\n`);
