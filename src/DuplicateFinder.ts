import * as fs from 'fs';
import * as path from 'path';

/**
 * Interface representing a duplicate file found between source and target directories.
 * Contains paths to the source file, target file, and the new location where the file will be moved.
 */
export interface DuplicateFile {
  /** Path to the file in the source directory */
  sourcePath: string;
  /** Path to the matching file in the target directory */
  targetPath: string;
  /** Path where the file will be moved to in the target directory */
  newPath: string;
}

/**
 * Class responsible for finding and moving duplicate files between source and target directories.
 *
 * This class scans both directories recursively, identifies files with the same names,
 * and provides functionality to move duplicate files from the source to the target directory
 * while preserving the directory structure.
 */
export class DuplicateFinder {
  /** Path to the source directory */
  private sourceDir: string;
  /** Path to the target directory */
  private targetDir: string;
  /** List of duplicate files found */
  private duplicates: DuplicateFile[] = [];
  /** List of file and directory names to ignore during scanning */
  private ignoredFiles: string[] = [
    '.DS_Store',
    'Thumbs.db',
    '.git',
    '.gitignore',
    '.svn',
    '.idea',
    '.vscode',
  ];

  /**
   * Creates a new DuplicateFinder instance.
   *
   * @param sourceDir - The source directory to scan for duplicates
   * @param targetDir - The target directory to scan for duplicates and move files to
   */
  constructor(sourceDir: string, targetDir: string) {
    this.sourceDir = path.resolve(sourceDir);
    this.targetDir = path.resolve(targetDir);
  }

  /**
   * Finds duplicate files between the source and target directories.
   *
   * This method scans both directories recursively, identifies files with the same names,
   * and calculates the new paths where the files would be moved to.
   *
   * @returns A promise that resolves to an array of DuplicateFile objects
   */
  public async findDuplicates(): Promise<DuplicateFile[]> {
    this.duplicates = [];

    // Read all files from source directory
    const sourceFiles = await this.readFilesRecursively(this.sourceDir);

    // Read all files from target directory
    const targetFiles = await this.readFilesRecursively(this.targetDir);

    // Create a map of target files for faster lookup
    const targetFileMap = new Map<string, string>();
    targetFiles.forEach((file) => {
      const fileName = path.basename(file);
      targetFileMap.set(fileName, file);
    });

    // Find duplicates
    sourceFiles.forEach((sourceFile) => {
      const fileName = path.basename(sourceFile);
      const targetFile = targetFileMap.get(fileName);

      if (targetFile) {
        // Calculate the new path in the target directory
        const relativePath = path.relative(this.sourceDir, sourceFile);
        const newPath = path.join(this.targetDir, relativePath);

        this.duplicates.push({
          sourcePath: sourceFile,
          targetPath: targetFile,
          newPath: newPath,
        });
      }
    });

    return this.duplicates;
  }

  /**
   * Moves duplicate files from the source directory to the target directory.
   *
   * This method iterates through all duplicate files found and moves them
   * from the source directory to the target directory, preserving the directory structure.
   * It creates any necessary directories in the target location.
   *
   * @returns A promise that resolves when all files have been moved
   */
  public async moveDuplicates(): Promise<void> {
    for (const duplicate of this.duplicates) {
      try {
        // Create the target directory if it doesn't exist
        const targetDir = path.dirname(duplicate.newPath);
        await fs.promises.mkdir(targetDir, { recursive: true });

        // Move the file
        await fs.promises.rename(duplicate.sourcePath, duplicate.newPath);
        console.log(`Moved file: ${duplicate.sourcePath} -> ${duplicate.newPath}`);
      } catch (error) {
        console.error(`Error moving file ${duplicate.sourcePath}:`, error);
      }
    }
  }

  /**
   * Recursively reads all files in a directory, excluding ignored files and directories.
   *
   * @param dir - The directory to scan
   * @returns A promise that resolves to an array of file paths
   */
  private async readFilesRecursively(dir: string): Promise<string[]> {
    const files: string[] = [];

    try {
      const entries = await fs.promises.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        // Skip ignored files and directories
        if (this.shouldIgnore(entry.name)) {
          continue;
        }

        if (entry.isDirectory()) {
          const subFiles = await this.readFilesRecursively(fullPath);
          files.push(...subFiles);
        } else {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.error(`Error reading directory ${dir}:`, error);
    }

    return files;
  }

  /**
   * Determines if a file or directory should be ignored based on its name.
   *
   * @param fileName - The name of the file or directory to check
   * @returns True if the file should be ignored, false otherwise
   */
  private shouldIgnore(fileName: string): boolean {
    return this.ignoredFiles.some(
      (ignoredFile) =>
        fileName === ignoredFile || fileName.startsWith('.') || fileName.endsWith('~'),
    );
  }
}
