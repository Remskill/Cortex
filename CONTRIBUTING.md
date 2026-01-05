# Contributing to Cortex

Thank you for your interest in contributing to Cortex! This document provides guidelines for contributing to the project.

## 🌟 How to Contribute

Contributions are welcome in many forms:

- 🐛 **Bug Reports**: Found a bug? Open an issue with steps to reproduce
- 💡 **Feature Requests**: Have an idea? Suggest it in an issue
- 📝 **Documentation**: Improve docs, fix typos, add examples
- 🔧 **Code**: Fix bugs, implement features, improve performance
- 🧪 **Testing**: Add tests, report edge cases
- 🎨 **UX/UI**: Improve error messages, CLI output, documentation

## 🚀 Getting Started

### 1. Fork & Clone

```bash
# Fork the repository on GitHub
# Then clone your fork
git clone https://github.com/YOUR_USERNAME/Cortex.git
cd Cortex
```

### 2. Set Up Development Environment

```bash
# Install dependencies
npm install

# Start Docker services
docker-compose up -d

# Initialize database
npm run setup
```

### 3. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

## 💻 Development Workflow

### Running Tests

```bash
# Run tests (if available)
npm test

# Type check
npx tsc --noEmit
```

### Code Style

- **TypeScript**: Follow existing code style
- **Formatting**: Use Prettier (if configured)
- **Naming**: Use descriptive variable and function names
- **Comments**: Add comments for complex logic

### Commit Messages

Use conventional commit format:

```
feat: add support for Python file types
fix: resolve memory leak in sync process
docs: update installation instructions
refactor: simplify query logic
test: add tests for chunking algorithm
```

## 📋 Pull Request Process

### Before Submitting

1. ✅ Test your changes thoroughly
2. ✅ Update documentation if needed
3. ✅ Add tests if applicable
4. ✅ Ensure code follows project style
5. ✅ Update CHANGELOG.md (if exists)

### Submitting

1. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Open a Pull Request** on GitHub
   - Use a clear title
   - Describe what you changed and why
   - Link to related issues (if any)
   - Add screenshots for UI changes

3. **Address feedback**
   - Respond to reviewer comments
   - Make requested changes
   - Push updates to your branch

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Refactoring

## Testing
How did you test this?

## Screenshots (if applicable)
Add screenshots here

## Checklist
- [ ] Code follows project style
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] All tests pass
```

## 🐛 Reporting Bugs

### Bug Report Template

```markdown
## Bug Description
Clear description of the bug

## Steps to Reproduce
1. Step 1
2. Step 2
3. Step 3

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: Windows/Mac/Linux
- Node.js version:
- Docker version:
- Cortex version:

## Logs/Screenshots
Paste relevant logs or screenshots
```

## 💡 Requesting Features

### Feature Request Template

```markdown
## Feature Description
Clear description of the feature

## Use Case
Why is this feature needed?

## Proposed Solution
How should it work?

## Alternatives
Other ways to solve this

## Additional Context
Any other relevant information
```

## 📝 Documentation

Documentation improvements are always welcome!

- Fix typos
- Clarify confusing sections
- Add examples
- Improve code comments
- Update screenshots

Documentation files:
- `README.md` - Main documentation
- `SETUP_GUIDE.md` - Installation guide
- `QUICK_REFERENCE.md` - Command reference
- `TROUBLESHOOTING.md` - Common issues
- `DEPLOYMENT.md` - Production deployment

## 🎯 Areas for Contribution

Looking for where to start? Here are some areas that need help:

### High Priority
- [ ] Performance optimization for large codebases
- [ ] Additional file type support (Java, Ruby, PHP, etc.)
- [ ] Improved error messages
- [ ] Better memory management during sync
- [ ] Unit tests for core functionality

### Medium Priority
- [ ] CLI improvements
- [ ] Better progress indicators
- [ ] Multi-language documentation
- [ ] Docker image optimization
- [ ] Query result ranking improvements

### Low Priority
- [ ] Logo/branding
- [ ] Example projects
- [ ] Video tutorials
- [ ] Blog posts
- [ ] Case studies

## ❓ Questions?

- Open an issue with the `question` label
- Start a discussion on GitHub Discussions
- Contact [@denys_medvediev](https://buymeacoffee.com/denys_medvediev)

## 📜 License

By contributing to Cortex, you agree that your contributions will be licensed under the MIT License.

## 🙏 Thank You!

Every contribution, no matter how small, helps make Cortex better for everyone. Thank you for taking the time to contribute!

---

**Made with ❤️ by the Cortex community**
