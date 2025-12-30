# Security Policy

## Supported Versions

The following versions of Fire Tools are currently being supported with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

We recommend always using the latest version available to ensure you have the most recent security patches.

## Reporting a Vulnerability

We take the security of Fire Tools seriously. If you discover a security vulnerability, please report it responsibly.

### How to Report

**Email**: security@mb-consulting.dev

**Please include**:
- A clear description of the vulnerability
- Steps to reproduce the issue
- Potential impact of the vulnerability
- Any suggested fixes (if applicable)

### What to Expect

1. **Acknowledgment**: We will acknowledge receipt of your vulnerability report within **48 hours**.

2. **Assessment**: We will assess the vulnerability and determine its severity and impact within **5 business days**.

3. **Updates**: We will keep you informed of our progress as we work on a fix.

4. **Resolution**: 
   - **Critical vulnerabilities**: We aim to release a fix within 7 days
   - **High severity**: We aim to release a fix within 14 days
   - **Medium/Low severity**: We aim to release a fix within 30 days

5. **Disclosure**: Once a fix is released, we will publicly disclose the vulnerability (with credit to you, if desired) in our release notes.

### What NOT to Do

Please **do not**:
- Publicly disclose the vulnerability before a fix is available
- Exploit the vulnerability beyond what is necessary to demonstrate it
- Access, modify, or delete data that doesn't belong to you
- Perform DoS attacks or social engineering

## Security Best Practices for Contributors

When contributing to Fire Tools, please follow these security guidelines:

### Data Security
- **Never commit secrets** - API keys, passwords, or tokens should never be in the codebase
- **Use encryption** - All sensitive data is encrypted using AES before storage
- **Validate input** - Sanitize and validate all user input
- **No eval()** - Never use `eval()` or `Function()` constructor with user input

### Code Security
- **Dependencies** - Keep dependencies up to date and review security advisories
- **XSS Prevention** - React provides automatic escaping, but be careful with `dangerouslySetInnerHTML`
- **HTTPS Only** - Ensure secure cookies are used (configured automatically)
- **No console.log** - Remove debug statements that could leak sensitive information

### Testing
- **Test edge cases** - Include security-related test cases
- **Check npm audit** - Run `npm audit` before submitting PRs
- **Review dependencies** - Be cautious when adding new dependencies

## Known Security Considerations

### Client-Side Application
Fire Tools is a **client-side only** application. This means:
- ✅ No user data is transmitted to external servers
- ✅ All data processing happens locally in the browser
- ✅ Users have full control over their data
- ⚠️ Users are responsible for backing up their data (export feature available)

### Data Storage
- **Encrypted cookies** are used to store financial data
- **AES-256 encryption** protects data at rest
- **No server-side storage** means no risk of server breaches
- **Cookie expiration** is set to 365 days

### Browser Security
This application relies on browser security features:
- `SameSite=Strict` cookies prevent CSRF attacks
- `Secure` flag ensures HTTPS-only transmission (in production)
- React's automatic escaping prevents XSS attacks
- No use of `eval()` or dangerous functions

## Security Updates

Security updates will be:
- Released as soon as possible after discovery
- Documented in release notes
- Announced on the repository's GitHub page
- Tagged with `security` label in releases

## Questions?

If you have questions about security that aren't covered here, please:
1. Check the [SUPPORT.md](SUPPORT.md) for general support
2. Open a GitHub issue for non-sensitive security questions
3. Email security@mb-consulting.dev for sensitive matters

Thank you for helping keep Fire Tools secure!
