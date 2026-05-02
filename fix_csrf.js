const fs = require('fs');
const path = require('path');

const targetFiles = [
    "app/api/user/settings/route.ts",
    "app/api/tier/switch/route.ts",
    "app/api/sync/start/route.ts",
    "app/api/coaching/route.ts",
    "app/api/stripe/portal/route.ts",
    "app/api/stripe/checkout/route.ts",
    "app/api/dev/mock-stripe/route.ts",
    "app/api/admin/users/tier/route.ts",
    "app/api/admin/users/status/route.ts",
    "app/api/admin/users/delete/route.ts",
    "app/api/admin/settings/route.ts",
    "app/api/admin/reports/regenerate/route.ts",
    "app/api/admin/reports/delete/route.ts",
    "app/api/admin/cache/clear/route.ts",
    "app/api/admin/test/riot/route.ts",
    "app/api/admin/test/openai/route.ts"
];

for (const file of targetFiles) {
    const fullPath = path.join(__dirname, file);
    if (!fs.existsSync(fullPath)) continue;

    let content = fs.readFileSync(fullPath, 'utf8');

    // Skip if already contains validateOrigin
    if (content.includes('validateOrigin')) continue;

    // Determine import
    let importStatement = 'import { validateOrigin } from "@/lib/security";\n';
    
    // Inject import
    const lastImportIndex = content.lastIndexOf('import ');
    if (lastImportIndex !== -1) {
        const endOfImport = content.indexOf('\n', lastImportIndex);
        content = content.slice(0, endOfImport + 1) + importStatement + content.slice(endOfImport + 1);
    } else {
        content = importStatement + content;
    }

    const replaceFunc = (match, method, args) => {
        let reqVar = 'req';
        if (args.trim() === '') {
            args = 'req: Request';
        } else {
            const firstArg = args.split(',')[0];
            reqVar = firstArg.split(':')[0].trim();
        }
        
        let nextRes = content.includes('NextResponse') ? 'NextResponse' : 'Response';
        
        return `export async function ${method}(${args}) {\n  if (!validateOrigin(${reqVar})) return ${nextRes}.json({ error: "Invalid Origin" }, { status: 403 });\n`;
    };

    // Replace POST, PUT, DELETE
    content = content.replace(/export async function (POST|PUT|DELETE)\((.*?)\)\s*\{/g, replaceFunc);
    
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log("Updated", file);
}
