import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { DuplicateFinder } from '../DuplicateFinder';

// Mock the DuplicateFinder class
jest.mock('../DuplicateFinder');

// Mock the commander package
jest.mock('commander', () => {
  const mockProgram = {
    name: jest.fn().mockReturnThis(),
    description: jest.fn().mockReturnThis(),
    version: jest.fn().mockReturnThis(),
    requiredOption: jest.fn().mockReturnThis(),
    option: jest.fn().mockReturnThis(),
    parse: jest.fn(),
    opts: jest.fn()
  };

  return {
    Command: jest.fn(() => mockProgram)
  };
});

// Mock readline
jest.mock('readline', () => ({
  createInterface: jest.fn()
}));

describe('App', () => {
  let mockDuplicateFinder: jest.Mocked<DuplicateFinder>;
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  const originalProcessExit = process.exit;

  beforeEach(() => {
    // Mock console methods
    console.log = jest.fn();
    console.error = jest.fn();
    process.exit = jest.fn() as unknown as (code?: number) => never;

    // Mock DuplicateFinder
    mockDuplicateFinder = new DuplicateFinder('source', 'target') as jest.Mocked<DuplicateFinder>;
    (DuplicateFinder as jest.Mock).mockImplementation(() => mockDuplicateFinder);

    // Reset commander mock options for each test
    const mockProgram = new Command() as jest.Mocked<Command>;
    (mockProgram.opts as jest.Mock).mockReset();
  });

  afterEach(() => {
    // Restore console methods
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    process.exit = originalProcessExit;

    // Clear all mocks
    jest.clearAllMocks();
  });

  it('should handle no duplicate files found', async () => {
    // Mock findDuplicates to return empty array
    mockDuplicateFinder.findDuplicates.mockResolvedValue([]);

    // Set commander options
    const mockProgram = new Command() as jest.Mocked<Command>;
    (mockProgram.opts as jest.Mock).mockReturnValue({
      source: 'source',
      target: 'target',
      execute: false,
      yes: false
    });

    // Import and run the main function
    const { main } = require('../App');
    await main();

    expect(console.log).toHaveBeenCalledWith('No duplicate files found.');
  });

  it('should handle duplicate files in dry-run mode', async () => {
    // Mock findDuplicates to return some duplicates
    const mockDuplicates = [
      {
        sourcePath: 'source/file1.txt',
        targetPath: 'target/file1.txt',
        newPath: 'target/file1.txt'
      }
    ];
    mockDuplicateFinder.findDuplicates.mockResolvedValue(mockDuplicates);

    // Set commander options
    const mockProgram = new Command() as jest.Mocked<Command>;
    (mockProgram.opts as jest.Mock).mockReturnValue({
      source: 'source',
      target: 'target',
      execute: false,
      yes: false
    });

    // Import and run the main function
    const { main } = require('../App');
    await main();

    expect(console.log).toHaveBeenCalledWith('\nDRY RUN: No files were moved.');
    expect(console.log).toHaveBeenCalledWith('To actually move these files, run the command with --execute flag');
  });

  it('should handle duplicate files in execute mode with auto-confirm', async () => {
    // Mock findDuplicates to return some duplicates
    const mockDuplicates = [
      {
        sourcePath: 'source/file1.txt',
        targetPath: 'target/file1.txt',
        newPath: 'target/file1.txt'
      }
    ];
    mockDuplicateFinder.findDuplicates.mockResolvedValue(mockDuplicates);
    mockDuplicateFinder.moveDuplicates.mockResolvedValue();

    // Set commander options
    const mockProgram = new Command() as jest.Mocked<Command>;
    (mockProgram.opts as jest.Mock).mockReturnValue({
      source: 'source',
      target: 'target',
      execute: true,
      yes: true
    });

    // Import and run the main function
    const { main } = require('../App');
    await main();

    expect(mockDuplicateFinder.moveDuplicates).toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith('Done!');
  });

  it('should handle errors gracefully', async () => {
    // Mock findDuplicates to throw an error
    mockDuplicateFinder.findDuplicates.mockRejectedValue(new Error('Test error'));

    // Set commander options
    const mockProgram = new Command() as jest.Mocked<Command>;
    (mockProgram.opts as jest.Mock).mockReturnValue({
      source: 'source',
      target: 'target',
      execute: false,
      yes: false
    });

    // Import and run the main function
    const { main } = require('../App');
    await main();

    expect(console.error).toHaveBeenCalledWith('Error:', expect.any(Error));
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('should handle user confirmation in execute mode', async () => {
    // Mock findDuplicates to return some duplicates
    const mockDuplicates = [
      {
        sourcePath: 'source/file1.txt',
        targetPath: 'target/file1.txt',
        newPath: 'target/file1.txt'
      }
    ];
    mockDuplicateFinder.findDuplicates.mockResolvedValue(mockDuplicates);

    // Mock readline interface
    const mockReadline = {
      question: jest.fn((_, callback) => callback('y')),
      close: jest.fn()
    };
    jest.spyOn(require('readline'), 'createInterface').mockReturnValue(mockReadline);

    // Set commander options
    const mockProgram = new Command() as jest.Mocked<Command>;
    (mockProgram.opts as jest.Mock).mockReturnValue({
      source: 'source',
      target: 'target',
      execute: true,
      yes: false
    });

    // Import and run the main function
    const { main } = require('../App');
    await main();

    expect(mockReadline.question).toHaveBeenCalled();
    expect(mockReadline.close).toHaveBeenCalled();
    expect(mockDuplicateFinder.moveDuplicates).toHaveBeenCalled();
  });

  it('should handle user rejection in execute mode', async () => {
    // Mock findDuplicates to return some duplicates
    const mockDuplicates = [
      {
        sourcePath: 'source/file1.txt',
        targetPath: 'target/file1.txt',
        newPath: 'target/file1.txt'
      }
    ];
    mockDuplicateFinder.findDuplicates.mockResolvedValue(mockDuplicates);

    // Mock readline interface
    const mockReadline = {
      question: jest.fn((_, callback) => callback('n')),
      close: jest.fn()
    };
    jest.spyOn(require('readline'), 'createInterface').mockReturnValue(mockReadline);

    // Set commander options
    const mockProgram = new Command() as jest.Mocked<Command>;
    (mockProgram.opts as jest.Mock).mockReturnValue({
      source: 'source',
      target: 'target',
      execute: true,
      yes: false
    });

    // Import and run the main function
    const { main } = require('../App');
    await main();

    expect(mockReadline.question).toHaveBeenCalled();
    expect(mockReadline.close).toHaveBeenCalled();
    expect(mockDuplicateFinder.moveDuplicates).not.toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith('Operation cancelled by user.');
  });
}); 