import { Command } from 'commander';
import { DuplicateFinder } from './DuplicateFinder';
import * as readline from 'readline';

/**
 * Main application function that handles command-line arguments and orchestrates the duplicate file finding and moving process.
 *
 * This function:
 * 1. Parses command-line arguments using Commander.js
 * 2. Creates a DuplicateFinder instance with the provided source and target directories
 * 3. Finds duplicate files between the directories
 * 4. Either displays the duplicates (dry-run mode) or moves them (execute mode)
 *
 * Command-line options:
 * - -s, --source: Source directory to scan (duplicates will be moved from here)
 * - -t, --target: Target directory to scan for duplicates and move files to
 * - -e, --execute: Execute the moving of duplicate files (default is dry-run)
 * - -y, --yes: Skip confirmation prompt (default is to prompt for confirmation)
 */
export async function main() {
  const program = new Command();

  program
    .name('dupfinder')
    .description('Find and move duplicate files from source to target directory')
    .version('1.0.0')
    .requiredOption(
      '-s, --source <directory>',
      'Source directory to scan (duplicates will be moved from here)',
    )
    .requiredOption(
      '-t, --target <directory>',
      'Target directory to scan for duplicates and move files to',
    )
    .option('-e, --execute', 'Execute the moving of duplicate files (default is dry-run)', false)
    .option('-y, --yes', 'Skip confirmation prompt', false);

  // Only parse process.argv in non-test environment
  if (process.env.NODE_ENV !== 'test') {
    program.parse(process.argv);
  }

  const options = program.opts();

  try {
    const finder = new DuplicateFinder(options.source, options.target);
    const duplicates = await finder.findDuplicates();

    if (duplicates.length === 0) {
      console.log('No duplicate files found.');
      return;
    }

    console.log('\nFound duplicate files:');
    duplicates.forEach((dup, index) => {
      console.log(`\n${index + 1}. Source (will be moved): ${dup.sourcePath}`);
      console.log(`   Target (reference): ${dup.targetPath}`);
      console.log(`   New location: ${dup.newPath}`);
    });

    if (options.execute) {
      // If not in auto-confirm mode, ask for confirmation
      if (!options.yes) {
        const confirmed = await confirmAction(
          `Are you sure you want to move ${duplicates.length} files? (y/N): `,
        );
        if (!confirmed) {
          console.log('Operation cancelled by user.');
          return;
        }
      }

      console.log('\nExecuting move of duplicate files from source to target directory...');
      await finder.moveDuplicates();
      console.log('Done!');
    } else {
      console.log('\nDRY RUN: No files were moved.');
      console.log('To actually move these files, run the command with --execute flag');
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

/**
 * Prompts the user for confirmation before proceeding with an action.
 *
 * @param message - The confirmation message to display
 * @returns A promise that resolves to true if the user confirmed, false otherwise
 */
export function confirmAction(message: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(message, (answer) => {
      rl.close();
      // Default to 'no' for safety
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

// Start the application only in non-test environment
if (process.env.NODE_ENV !== 'test') {
  main();
}
