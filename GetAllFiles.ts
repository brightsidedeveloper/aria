import * as fs from 'fs';
import * as path from 'path';

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
    const files = fs.readdirSync(dirPath);

    files.forEach(file => {
        const filePath = path.join(dirPath, file);

        // Ignore node_modules and .git folders
        if (file === 'node_modules' || file === '.git') {
            return;
        }

        if (fs.statSync(filePath).isDirectory()) {
            arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
        } else {
            arrayOfFiles.push(path.relative(__dirname, filePath));
        }
    });

    return arrayOfFiles;
}

const rootDir = path.resolve(__dirname); // Get the absolute path of the root directory
const allFiles = getAllFiles(rootDir);

console.log(allFiles);