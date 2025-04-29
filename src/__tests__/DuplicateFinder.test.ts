import { DuplicateFinder } from '../DuplicateFinder';
import * as fs from 'fs';
import * as path from 'path';

describe('DuplicateFinder', () => {
  let sourceDir: string;
  let targetDir: string;
  let duplicateFinder: DuplicateFinder;
  let originalConsoleLog: typeof console.log;
  let originalConsoleError: typeof console.error;

  beforeEach(() => {
    // Mock console methods
    originalConsoleLog = console.log;
    originalConsoleError = console.error;
    console.log = jest.fn();
    console.error = jest.fn();

    // Create temporary test directories
    sourceDir = path.join(__dirname, 'test-source');
    targetDir = path.join(__dirname, 'test-target');

    // Create directories if they don't exist
    if (!fs.existsSync(sourceDir)) {
      fs.mkdirSync(sourceDir, { recursive: true });
    }
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    duplicateFinder = new DuplicateFinder(sourceDir, targetDir);
  });

  afterEach(() => {
    // Restore console methods
    console.log = originalConsoleLog;
    console.error = originalConsoleError;

    // Clean up test directories
    if (fs.existsSync(sourceDir)) {
      fs.rmSync(sourceDir, { recursive: true, force: true });
    }
    if (fs.existsSync(targetDir)) {
      fs.rmSync(targetDir, { recursive: true, force: true });
    }
  });

  it('should be initialized with source and target directories', () => {
    expect(duplicateFinder).toBeInstanceOf(DuplicateFinder);
  });

  it('should find duplicate files between source and target directories', async () => {
    // Create a test file in both directories
    const testFileName = 'test.txt';
    const sourceFilePath = path.join(sourceDir, testFileName);
    const targetFilePath = path.join(targetDir, testFileName);

    fs.writeFileSync(sourceFilePath, 'test content');
    fs.writeFileSync(targetFilePath, 'test content');

    const duplicates = await duplicateFinder.findDuplicates();
    expect(duplicates).toHaveLength(1);
    expect(duplicates[0].sourcePath).toBe(sourceFilePath);
    expect(duplicates[0].targetPath).toBe(targetFilePath);
  });

  it('should move duplicate files from source to target directory', async () => {
    // Create a test file in both directories
    const testFileName = 'test.txt';
    const sourceFilePath = path.join(sourceDir, testFileName);
    const targetFilePath = path.join(targetDir, testFileName);

    fs.writeFileSync(sourceFilePath, 'test content');
    fs.writeFileSync(targetFilePath, 'test content');

    await duplicateFinder.findDuplicates();
    await duplicateFinder.moveDuplicates();

    // Check if file was moved
    expect(fs.existsSync(sourceFilePath)).toBe(false);
    expect(fs.existsSync(targetFilePath)).toBe(true);
  });

  it('should ignore specified files and directories', async () => {
    // Create ignored files
    const ignoredFiles = ['.DS_Store', 'Thumbs.db', '.git'];
    ignoredFiles.forEach((file) => {
      fs.writeFileSync(path.join(sourceDir, file), 'ignored content');
      fs.writeFileSync(path.join(targetDir, file), 'ignored content');
    });

    const duplicates = await duplicateFinder.findDuplicates();
    expect(duplicates).toHaveLength(0);
  });

  it('should handle nested directories correctly', async () => {
    // Create nested directory structure
    const nestedDir = 'nested';
    const testFileName = 'test.txt';

    const sourceNestedDir = path.join(sourceDir, nestedDir);
    const targetNestedDir = path.join(targetDir, nestedDir);

    fs.mkdirSync(sourceNestedDir, { recursive: true });
    fs.mkdirSync(targetNestedDir, { recursive: true });

    const sourceFilePath = path.join(sourceNestedDir, testFileName);
    const targetFilePath = path.join(targetNestedDir, testFileName);

    fs.writeFileSync(sourceFilePath, 'test content');
    fs.writeFileSync(targetFilePath, 'test content');

    const duplicates = await duplicateFinder.findDuplicates();
    expect(duplicates).toHaveLength(1);
    expect(duplicates[0].sourcePath).toBe(sourceFilePath);
    expect(duplicates[0].targetPath).toBe(targetFilePath);
  });

  it('should handle errors when moving files', async () => {
    // Create a test file in both directories
    const testFileName = 'test.txt';
    const sourceFilePath = path.join(sourceDir, testFileName);
    const targetFilePath = path.join(targetDir, testFileName);

    fs.writeFileSync(sourceFilePath, 'test content');
    fs.writeFileSync(targetFilePath, 'test content');

    // Mock fs.promises.rename to throw an error
    const originalRename = fs.promises.rename;
    fs.promises.rename = jest.fn().mockRejectedValue(new Error('Move error'));

    await duplicateFinder.findDuplicates();
    await duplicateFinder.moveDuplicates();

    // Restore original rename function
    fs.promises.rename = originalRename;

    // Check that the file wasn't moved
    expect(fs.existsSync(sourceFilePath)).toBe(true);
    expect(fs.existsSync(targetFilePath)).toBe(true);
  });

  it('should handle errors when reading directories', async () => {
    // Mock fs.promises.readdir to throw an error
    const originalReaddir = fs.promises.readdir;
    fs.promises.readdir = jest.fn().mockRejectedValue(new Error('Read error'));

    const duplicates = await duplicateFinder.findDuplicates();
    expect(duplicates).toHaveLength(0);

    // Restore original readdir function
    fs.promises.readdir = originalReaddir;
  });
});
