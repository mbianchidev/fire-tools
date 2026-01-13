# Fire Tools

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.19.0-brightgreen)](package.json)

A comprehensive suite of financial tools for **FIRE (Financial Independence Retire Early)** planning. Track your journey to financial independence with powerful calculators, Monte Carlo simulations, and portfolio management features—all running securely in your browser with **no data ever leaving your device**.

## ⚠️ Disclaimer

Fire Tools is provided for **educational and planning purposes only**. The calculations and projections:

- Make assumptions about future market returns
- Do not account for all real-world factors
- Are not financial, legal, or tax advice
- Should not be the sole basis for financial decisions

**Always do your research or consult with a qualified financial advisor before making investment decisions.**

**[Try it live →](https://mbianchidev.github.io/fire-tools/)**

---

## Features

**🧮 FIRE Calculator**  
Calculate your path to financial independence with detailed projections based on your savings, expenses, and expected returns. Visualize your net worth growth and see exactly when you'll reach your FIRE target.

**🎲 Monte Carlo Simulations**  
Run thousands of probabilistic simulations accounting for market volatility and black swan events. Understand your real probability of success and make informed decisions with confidence.

**📊 Asset Allocation Manager**  
Track your portfolio allocation across stocks, bonds, real estate, commodities, and cash. Get intelligent rebalancing recommendations to maintain your target allocation with customizable allocation targets and visual feedback.

**💵 DCA Helper**  
Plan your dollar-cost averaging strategy with built-in calculations that help you invest systematically and reduce market timing risk.

**💰 Cashflow Tracker**  
Track your income and expenses with detailed categorization, set monthly budgets per category, and monitor your spending patterns. Interactive charts showing income vs expenses over time. Includes the 50/30/20 budgeting rule analysis and comprehensive spending analytics with trends and comparisons.

**📈 Net Worth Tracker**  
Track your complete financial picture on a monthly basis. Log assets (stocks, ETFs, bonds), cash & liquidity (bank accounts, credit cards), and pensions (state, private, employer). Record financial operations like dividends, purchases, sales, and taxes. View historical net worth charts with YTD and all-time views, plus forecasts with confidence indicators.

**🔒 Privacy-First & Secure**  
All data is encrypted with AES-256 and stored locally in your browser. No servers, no accounts, no data transmission—complete privacy guaranteed.

**📥 Export & Import**  
Back up your data anytime with CSV export. Import previously saved data to restore your settings across devices or after clearing cookies.

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20.19.0 or higher (or 22.12.0+, 24.0.0+)
- **npm** (comes with Node.js)

### Installation

```bash
# Clone the repository
git clone https://github.com/mbianchidev/fire-tools.git

# Navigate to the directory
cd fire-tools

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open your browser to `http://localhost:5173` and start planning your FIRE journey!

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

---

## Documentation

- **[CONTRIBUTING.md](CONTRIBUTING.md)** - How to contribute to the project
- **[AGENTS.md](AGENTS.md)** - Technical architecture and AI agent instructions
- **[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)** - Community guidelines
- **[SECURITY.md](SECURITY.md)** - Security policy and vulnerability reporting
- **[SUPPORT.md](SUPPORT.md)** - Getting help and support

---

## Technology Stack

- **React 19** - Modern UI framework with hooks
- **TypeScript** - Type-safe development
- **React Router** - Client-side routing
- **Vite** - Lightning-fast build tool
- **Recharts** - Beautiful data visualizations
- **crypto-js** - AES encryption for data security
- **js-cookie** - Secure cookie management

---

## Security & Privacy

Fire Tools takes your privacy seriously:

- ✅ **Client-side only** - No backend servers, all processing happens in your browser
- ✅ **AES-256 encryption** - All financial data is encrypted before storage
- ✅ **No data transmission** - Your data never leaves your device
- ✅ **Secure cookies** - `SameSite=Strict` and `Secure` flags protect against attacks
- ✅ **Open source** - Full transparency, audit the code yourself

Learn more in our [Security Policy](SECURITY.md).

---

## Contributing

We welcome contributions from the community! Whether you're fixing bugs, adding features, or improving documentation, your help makes Fire Tools better for everyone.

**To get started:**
1. Read our [Contributing Guide](CONTRIBUTING.md)
2. Check out [open issues](https://github.com/mbianchidev/fire-tools/issues)
3. Fork the repo and create a feature branch
4. Submit a pull request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

---

## License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## Security

Found a security vulnerability? Please report it responsibly to **security@mb-consulting.dev**.  
See [SECURITY.md](SECURITY.md) for our security policy and disclosure process.

---

## Support

Need help? Have questions?

- 📖 Check the [documentation](#-documentation) above
- 🐛 [Open an issue](https://github.com/mbianchidev/fire-tools/issues/new) for bug reports
- 💡 [Request a feature](https://github.com/mbianchidev/fire-tools/issues/new) with your ideas
- 💬 See [SUPPORT.md](SUPPORT.md) for more support options

---

## 📋 Code of Conduct

This project adheres to a [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to security@mb-consulting.dev.
