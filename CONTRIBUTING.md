# Contributing to RWA DeFi Platform

Thank you for your interest in contributing to the RWA DeFi Platform! This document provides guidelines and instructions for contributing.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)

## 🤝 Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inspiring community for all. Please be respectful and constructive in your interactions.

### Our Standards

- Use welcoming and inclusive language
- Be respectful of differing viewpoints
- Accept constructive criticism gracefully
- Focus on what is best for the community
- Show empathy towards other community members

## 🚀 Getting Started

### 1. Fork the Repository

```bash
# Fork on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/rwa-defi-platform.git
cd rwa-defi-platform

# Add upstream remote
git remote add upstream https://github.com/mbdtf202-cyber/rwa-defi-platform.git
```

### 2. Set Up Development Environment

Follow the [Getting Started Guide](GETTING_STARTED.md) to set up your local environment.

### 3. Create a Branch

```bash
# Update your fork
git checkout main
git pull upstream main

# Create a feature branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/bug-description
```

## 💻 Development Workflow

### Branch Naming Convention

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions or updates
- `chore/` - Maintenance tasks

Examples:
- `feature/add-property-search`
- `fix/kyc-verification-bug`
- `docs/update-api-documentation`

### Commit Message Format

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**

```bash
feat(token): Add dividend distribution functionality

Implement automatic dividend distribution to token holders
based on their holdings and lock period.

Closes #123
```

```bash
fix(kyc): Resolve Onfido webhook verification issue

The webhook signature verification was failing due to
incorrect header parsing. Updated to use the correct
header format.

Fixes #456
```

## 📝 Coding Standards

### TypeScript/JavaScript

- Use TypeScript for all new code
- Follow ESLint configuration
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Prefer `const` over `let`, avoid `var`
- Use async/await over promises when possible

**Example:**

```typescript
/**
 * Calculate property valuation using ML model
 * @param propertyId - Unique property identifier
 * @param features - Property features for valuation
 * @returns Valuation result with confidence score
 */
async function calculateValuation(
  propertyId: string,
  features: PropertyFeatures
): Promise<ValuationResult> {
  // Implementation
}
```

### Solidity

- Follow Solidity style guide
- Use latest stable version (0.8.20+)
- Add NatSpec comments
- Implement comprehensive tests
- Consider gas optimization
- Use OpenZeppelin libraries when possible

**Example:**

```solidity
/**
 * @notice Mint new tokens to a whitelisted address
 * @param to Address to receive tokens
 * @param amount Amount of tokens to mint
 * @dev Requires MINTER_ROLE and recipient must be whitelisted
 */
function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
    require(isWhitelisted(to), "Recipient not whitelisted");
    _mint(to, amount);
}
```

### Python

- Follow PEP 8 style guide
- Use type hints
- Add docstrings for functions and classes
- Use meaningful variable names
- Keep functions focused and small

**Example:**

```python
def calculate_risk_score(
    property_data: PropertyData,
    market_data: MarketData
) -> RiskScore:
    """
    Calculate risk score for a property investment.
    
    Args:
        property_data: Property characteristics and metrics
        market_data: Current market conditions
        
    Returns:
        RiskScore object with score and factors
    """
    # Implementation
```

## 🧪 Testing Guidelines

### Test Coverage Requirements

- Smart Contracts: 90%+ coverage
- Backend: 80%+ coverage
- Frontend: 70%+ coverage
- ML Services: 75%+ coverage

### Writing Tests

**Smart Contracts:**

```typescript
describe("PermissionedToken", function () {
  it("should mint tokens to whitelisted address", async function () {
    await token.addToWhitelist(user.address);
    await token.mint(user.address, ethers.parseEther("100"));
    expect(await token.balanceOf(user.address)).to.equal(
      ethers.parseEther("100")
    );
  });
});
```

**Backend:**

```typescript
describe('AuthController', () => {
  it('should register a new user', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'test@example.com',
        password: 'Test123!',
        firstName: 'Test',
        lastName: 'User',
      })
      .expect(201);

    expect(response.body).toHaveProperty('accessToken');
  });
});
```

### Running Tests

```bash
# Run all tests
./scripts/test-all.sh

# Run specific test suites
cd packages/contracts && npm run test
cd packages/backend && npm run test
cd packages/ml-services && pytest
```

## 🔄 Pull Request Process

### Before Submitting

1. **Update your branch**
   ```bash
   git checkout main
   git pull upstream main
   git checkout your-feature-branch
   git rebase main
   ```

2. **Run tests**
   ```bash
   ./scripts/test-all.sh
   ```

3. **Run linters**
   ```bash
   npm run lint
   ```

4. **Update documentation** if needed

### Submitting a Pull Request

1. **Push your changes**
   ```bash
   git push origin your-feature-branch
   ```

2. **Create Pull Request** on GitHub

3. **Fill out the PR template** with:
   - Description of changes
   - Related issue numbers
   - Testing performed
   - Screenshots (if UI changes)

4. **Request review** from maintainers

### PR Review Process

- At least one approval required
- All CI checks must pass
- No merge conflicts
- Code follows style guidelines
- Tests are included and passing
- Documentation is updated

### After Approval

- Maintainers will merge your PR
- Your branch will be deleted
- Changes will be included in next release

## 🐛 Issue Reporting

### Before Creating an Issue

1. Search existing issues
2. Check documentation
3. Try latest version

### Creating a Good Issue

**Bug Report Template:**

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g. macOS 13.0]
- Node version: [e.g. 18.0.0]
- Browser: [e.g. Chrome 120]

**Additional context**
Any other relevant information.
```

**Feature Request Template:**

```markdown
**Is your feature request related to a problem?**
A clear description of the problem.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Other solutions you've thought about.

**Additional context**
Any other relevant information.
```

## 📚 Additional Resources

- [Getting Started Guide](GETTING_STARTED.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Project Status](PROJECT_STATUS.md)
- [API Documentation](http://localhost:3000/api)

## 🎯 Areas for Contribution

We especially welcome contributions in these areas:

### High Priority
- [ ] Additional smart contract tests
- [ ] Backend integration tests
- [ ] Frontend unit tests
- [ ] Security improvements
- [ ] Performance optimizations

### Medium Priority
- [ ] Documentation improvements
- [ ] Code refactoring
- [ ] UI/UX enhancements
- [ ] Additional ML models
- [ ] Internationalization (i18n)

### Nice to Have
- [ ] Mobile app
- [ ] Additional blockchain support
- [ ] Advanced analytics
- [ ] Community features
- [ ] Developer tools

## 💬 Communication

- **GitHub Issues**: Bug reports and feature requests
- **Pull Requests**: Code contributions
- **Discussions**: General questions and ideas

## 🙏 Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Credited in documentation

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to the RWA DeFi Platform! 🚀
