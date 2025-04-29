# DupFinder

A command-line tool to find and move duplicate files based on exact file names from source to target directories. System files like `.DS_Store` are automatically ignored.

## Installation

1. Clone this repository
2. Install dependencies:
```bash
pnpm install
```

## Usage

The tool operates in two modes:
1. Dry-run mode (default): Lists all duplicate files that would be moved
2. Execute mode: Actually moves the duplicate files from source to target directory

### Basic Usage

To find duplicates (dry-run mode):

```bash
pnpm dev -- -s /path/to/source -t /path/to/target
```

To find and move duplicates from source to target directory:

```bash
pnpm dev -- -s /path/to/source -t /path/to/target --execute
```

### Options

- `-s, --source <directory>`: Source directory to scan (duplicates will be moved from here)
- `-t, --target <directory>`: Target directory to scan for duplicates and move files to
- `-e, --execute`: Execute the moving of duplicate files (default is dry-run)
- `-y, --yes`: Skip confirmation prompt (default is to prompt for confirmation)
- `--help`: Display help information
- `--version`: Display version information

### Safety Features

- **Confirmation Prompt**: By default, the tool will ask for confirmation before moving any files
- **Dry-run Mode**: The default mode only shows what would be moved without actually moving anything
- **System File Ignoring**: Common system files like `.DS_Store` are automatically ignored

### Ignored Files

The tool automatically ignores common system files and directories:
- `.DS_Store` (macOS)
- `Thumbs.db` (Windows)
- `.git`, `.gitignore` (Git)
- `.svn` (Subversion)
- `.idea`, `.vscode` (IDE settings)
- Any file starting with a dot (`.`)
- Any file ending with a tilde (`~`)

## Example

```bash
# Find duplicates (dry-run)
pnpm dev -- -s ./documents -t ./backup

# Find and move duplicates from source to target directory
pnpm dev -- -s ./documents -t ./backup --execute

# Skip confirmation prompt
pnpm dev -- -s ./documents -t ./backup --execute --yes
```

## Building

To build the project:

```bash
pnpm build
```

The compiled JavaScript files will be in the `dist` directory.

## Running the Built Version

After building, you can run the tool using:

```bash
pnpm start -- -s /path/to/source -t /path/to/target
```

## More Examples
```bash
pnpm dev -- -s '/Volumes/LaCie 5TB/Transfer/2025 Q1' -t '/Volumes/LaCie 5TB/Transfer/20250312 TW iCloud' > output.log
```