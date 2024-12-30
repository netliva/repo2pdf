# Repo2Pdf

Convert GitHub repositories to beautiful PDFs with syntax highlighting and proper formatting.

## Features

- Convert any GitHub repository to PDF
- Syntax highlighting for code files
- Support for multiple programming languages
- Progress tracking during conversion
- Multilingual support (English and Turkish)
- Clean and readable output format
- Git history and commit information support
- Customizable file size limits and exclusions

## Installation

```bash
npm install -g repo2pdf
```

## Usage

```bash
repo2pdf <source> <output> [options]
```

### Options

- `--output`: Specify output PDF file path
- `--language, --lang`: Set interface language (en/tr)
- `--theme, -t`: Choose syntax highlighting theme (default: 'light')
- `--lang-filter, -l`: Filter files by language/extension
- `--line-numbers, -n`: Show line numbers in code blocks
- `--git-history, -g`: Include git history information
- `--metadata, -m`: Include repository metadata (default: true)
- `--commit-info, -c`: Include commit information
- `--exclude, -e`: Exclude files matching pattern (comma-separated)
- `--max-size, -s`: Maximum file size in KB (default: 1000)
- `--progress, -p`: Show progress during conversion

### Example

```bash
repo2pdf https://github.com/username/repository output.pdf --theme=dark --line-numbers --git-history
```

## Requirements

- Node.js >= 14
- Git (installed and configured)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
