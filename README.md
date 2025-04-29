# DupFinder

A command-line tool to find and move duplicate files based on exact file names from source to target directories. System files like `.DS_Store` are automatically ignored.

## Installation

1. Clone this repository
2. Install dependencies:
```bash
npm install
```

## Usage

The tool operates in two modes:
1. Dry-run mode (default): Lists all duplicate files that would be moved
2. Execute mode: Actually moves the duplicate files from source to target directory

### Basic Usage

To find duplicates (dry-run mode):

```bash
npm run dev -- -s /path/to/source -t /path/to/target

## example
npm run dev -- -s '/Volumes/LaCie 5TB/Transfer/2025 Q1 Copy' -t '/Volumes/LaCie 5TB/Transfer/20250312 TW iCloud'
npm run dev -- -s  '/Volumes/LaCie 5TB/Transfer/2025 Q1 Copy/2025 Q1 iCloud' -t '/Volumes/LaCie 5TB/Transfer/20250312 TW iCloud'
```

To find and move duplicates from source to target directory:

```bash
npm run dev -- -s /path/to/source -t /path/to/target --execute
```

### Options

- `-s, --source <directory>`: Source directory to scan (duplicates will be moved from here)
- `-t, --target <directory>`: Target directory to scan for duplicates and move files to
- `-e, --execute`: Execute the moving of duplicate files (default is dry-run)
- `--help`: Display help information
- `--version`: Display version information

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
npm run dev -- -s ./documents -t ./backup

# Find and move duplicates from source to target directory
npm run dev -- -s ./documents -t ./backup --execute
```

## Building

To build the project:

```bash
npm run build
```

The compiled JavaScript files will be in the `dist` directory.

## Running the Built Version

After building, you can run the tool using:

```bash
npm start -- -s /path/to/source -t /path/to/target
``` 