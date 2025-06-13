import fs from 'fs';
import path from 'path';

const docsDirectory = path.join(process.cwd(), 'src/data');

export function getDocsContent() {
    const fullPath = path.join(docsDirectory, 'suna_wiki.md');
    const fileContents = fs.readFileSync(fullPath, 'utf8');

    const sections = fileContents.split('<a id=').slice(1);

    const allSections = sections.map(section => {
        const idMatch = section.match(/'(.*?)'/);
        const titleMatch = section.match(/## (.*?)\n/);
        
        const id = idMatch ? idMatch[1] : 'unknown';
        const title = titleMatch ? titleMatch[1].replace(/<a.*?>.*?<\/a>/g, '').trim() : 'Untitled';
        const content = section.substring(section.indexOf('##'));

        return {
            id,
            title,
            content,
        };
    });

    return allSections;
}

export function getDocById(id: string) {
    const allDocs = getDocsContent();
    return allDocs.find(doc => doc.id === id);
} 