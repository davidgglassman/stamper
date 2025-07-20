# Stamper CLI

A powerful CLI tool for scaffolding projects from Nunjucks templates with interactive questions and automatic git setup.

## Quick Start

Create a new project instantly:

```bash
npx stamper-cli
```

Or install globally and use anywhere:

```bash
npm install -g stamper-cli
stamper-cli
```

## Features

- 🎯 **Interactive Templates** - Choose from organization and user templates
- 🤔 **Smart Questions** - 7 question types: input, confirm, select, checkbox, password, number, rawlist
- ⚡ **Nunjucks Templating** - Dynamic file generation with variables and logic
- 📦 **Git Integration** - Automatic repository initialization with initial commit
- 🎨 **Professional UX** - Progress indicators, error handling, and next-step guidance
- 🏢 **Organization Support** - Centralized template management via GitHub repositories

## Installation

### Global Installation (Recommended)

```bash
npm install -g stamper-cli
```

Then use anywhere:

```bash
stamper-cli create
```

### One-time Usage

```bash
npx stamper-cli
```

### Development Installation

For development or local testing:

```bash
git clone https://github.com/davidgglassman/stamper.git
cd stamper
npm install
npm run build
```

## Basic Usage

### Create a Project

```bash
stamper-cli create
```

This will:
1. Show available templates (organization + user templates)
2. Ask template-specific questions
3. Generate project files with your answers
4. Optionally initialize a git repository
5. Provide next steps for development

### Manage Templates

```bash
# List all available templates
stamper-cli list

# Add a personal template
stamper-cli add my-template https://github.com/username/my-template

# Remove a personal template
stamper-cli remove my-template

# Organization setup (first time)
stamper-cli setup
```

### Organization Management

```bash
# View organization status
stamper-cli org

# Set organization repository URL
stamper-cli org set-url

# Refresh organization templates
stamper-cli org refresh

# Clear organization configuration
stamper-cli org clear
```

## Creating Templates

### Template Repository Structure

A template repository should have this structure:

```
my-template/
├── stamper.yaml          # Required: Template configuration
├── package.json.njk      # Nunjucks template files (processed)
├── README.md.njk         # Nunjucks template files (processed)
├── src/
│   └── main.js           # Regular files (copied as-is)
└── .env.example.njk      # Nunjucks template files (processed)
```

### Template Configuration (`stamper.yaml`)

```yaml
name: "My Awesome Template"
description: "A template for awesome projects"
questions:
  - name: "project_name"
    type: "input"
    message: "What's your project name?"
    default: "my-project"
  
  - name: "include_testing"
    type: "confirm"
    message: "Include testing setup?"
    default: true
  
  - name: "framework"
    type: "select"
    message: "Choose a framework:"
    choices:
      - "react"
      - "vue"
      - "angular"
    default: "react"
  
  - name: "features"
    type: "checkbox"
    message: "Select features:"
    choices:
      - "routing"
      - "state-management"
      - "testing"
    default: ["routing"]
  
  - name: "api_key"
    type: "password"
    message: "Enter API key (optional):"
  
  - name: "port"
    type: "number"
    message: "Development port:"
    default: 3000
  
  - name: "deployment"
    type: "rawlist"
    message: "Choose deployment:"
    choices:
      - "vercel"
      - "netlify"
      - "aws"
    default: "vercel"
```

### Question Types

| Type | Description | Example |
|------|-------------|---------|
| `input` | Text input | Project name, author name |
| `confirm` | Yes/no question | Include testing? |
| `select` | Single choice from list | Choose framework |
| `checkbox` | Multiple choices from list | Select features |
| `password` | Hidden text input | API keys, secrets |
| `number` | Numeric input | Port number, limits |
| `rawlist` | Numbered list selection | Deployment target |

### Nunjucks Template Files

Files ending with `.njk` are processed with Nunjucks templating:

**package.json.njk:**
```json
{
  "name": "{{ project_name }}",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite --port {{ port }}"{% if include_testing %},
    "test": "jest"{% endif %}
  },
  "dependencies": {
    "{{ framework }}": "latest"{% if "state-management" in features %},
    "zustand": "^4.0.0"{% endif %}
  }
}
```

**README.md.njk:**
```markdown
# {{ project_name }}

A {{ framework }} project{% if include_testing %} with testing{% endif %}.

## Features
{% for feature in features %}
- ✅ {{ feature|title }}{% endfor %}

## Development

Start the server on port {{ port }}:
\`\`\`bash
npm run dev
\`\`\`

{% if include_testing %}## Testing
\`\`\`bash
npm test
\`\`\`{% endif %}
```

**.env.example.njk:**
```env
APP_NAME={{ project_name }}
PORT={{ port }}{% if api_key %}
API_KEY={{ api_key }}{% endif %}
FRAMEWORK={{ framework }}
```

### Nunjucks Features

- **Variables**: `{{ variable_name }}`
- **Conditionals**: `{% if condition %}...{% endif %}`
- **Loops**: `{% for item in array %}...{% endfor %}`
- **Filters**: `{{ text|upper }}`, `{{ text|title }}`
- **Array checks**: `{% if "item" in array %}`

## Organization Template Management

### Setting Up Organization Templates

1. **Create a GitHub repository** for your organization templates
2. **Add a `manifest.yaml` file** in the repository root:

```yaml
name: "Company Templates"
description: "Standard templates for our development team"
templates:
  - name: "react-app"
    url: "https://github.com/company/react-template"
    description: "Standard React app with company guidelines"
  
  - name: "api-service"
    url: "https://github.com/company/api-template"
    description: "Microservice template with authentication"
  
  - name: "landing-page"
    url: "https://github.com/company/landing-template"
    description: "Marketing landing page template"
```

3. **Share the repository URL** with your team
4. **Team members run setup**:

```bash
stamper-cli setup
# Enter: https://github.com/company/templates
```

### Organization Repository Structure

```
company-templates/
├── manifest.yaml         # Required: Template manifest
└── README.md            # Optional: Documentation
```

### Template Repository Requirements

Each template repository referenced in `manifest.yaml` must:

1. **Be accessible** (public or internal with proper permissions)
2. **Contain `stamper.yaml`** with template configuration
3. **Have template files** (`.njk` files processed, others copied)

### Organization Benefits

- **Centralized Management**: IT/DevOps teams control approved templates
- **Automatic Updates**: Templates refresh automatically (1-hour cache)
- **Read-only Protection**: Users can't modify organization templates
- **Consistent Standards**: Enforce coding standards and best practices

## Advanced Usage

### Using with Different Output Directories

```bash
stamper-cli create --output-dir ./my-new-project
```

### Template Development Workflow

1. **Create template repository**:
```bash
mkdir my-template
cd my-template
git init
```

2. **Add template configuration**:
```yaml
# stamper.yaml
name: "My Template"
description: "Description here"
questions: [...]
```

3. **Create template files**:
```bash
touch package.json.njk
touch README.md.njk
mkdir src
touch src/index.js
```

4. **Test locally**:
```bash
stamper-cli add test-template ./
stamper-cli create
# Select "test-template"
```

5. **Publish to GitHub**:
```bash
git add .
git commit -m "Initial template"
git remote add origin https://github.com/username/my-template
git push -u origin main
```

6. **Use remotely**:
```bash
stamper-cli add my-template https://github.com/username/my-template
```

### Environment Variables

Stamper respects these environment variables:

- `npm_config_user_config`: Detects npm create usage
- Standard git configuration for repository initialization

### Configuration File Location

Stamper stores configuration in:
- **macOS/Linux**: `~/.config/stamper/config.json`
- **Windows**: `%APPDATA%/stamper/config.json`

## Troubleshooting

### Common Issues

**"Repository not found"**
- Verify the GitHub URL is correct
- Ensure the repository is public or you have access
- Check your internet connection

**"Template processing failed"**
- Check `stamper.yaml` syntax
- Verify all variables are defined in questions
- Review Nunjucks template syntax in `.njk` files

**"Git initialization failed"**
- Ensure Git is installed and in PATH
- Configure git user: `git config --global user.name "Your Name"`
- Configure git email: `git config --global user.email "you@example.com"`

**"Permission denied"**
- Check write permissions for output directory
- Try a different output directory
- Run with appropriate permissions

### Getting Help

- **Issues**: https://github.com/davidgglassman/stamper/issues
- **Documentation**: This README
- **Examples**: Check the test templates in the repository

## Examples

### React Template Example

**Repository**: https://github.com/company/react-template

**stamper.yaml**:
```yaml
name: "React TypeScript Template"
description: "Modern React app with TypeScript and Vite"
questions:
  - name: "project_name"
    type: "input"
    message: "Project name?"
    default: "my-react-app"
  - name: "include_testing"
    type: "confirm"
    message: "Include testing?"
    default: true
  - name: "styling"
    type: "select"
    message: "Choose styling:"
    choices: ["vanilla", "tailwind", "styled-components"]
    default: "tailwind"
```

**Usage**:
```bash
stamper-cli add react-template https://github.com/company/react-template
stamper-cli create
# Select "react-template"
# Answer questions
# Project generated with your preferences
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.