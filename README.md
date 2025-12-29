# 🔥 Fire Tools

A comprehensive suite of financial tools for FIRE (Financial Independence Retire Early) planning, including calculators and portfolio management features.

## 🌐 Live Demo

The latest version is automatically deployed to: **[https://mbianchidev.github.io/fire-calculator/](https://mbianchidev.github.io/fire-calculator/)**

## Features

### 🏠 Homepage
- Overview of all available tools
- Quick navigation to FIRE Calculator and Asset Allocation Manager
- Clear descriptions of each tool's functionality

### 🔥 FIRE Calculator
- **Comprehensive Input Parameters**
  - Initial savings and asset allocation (stocks, bonds, cash)
  - Income and expense projections
  - Customizable FIRE targets and withdrawal rates
  - Expected market returns and growth rates
  - Personal information (age, retirement age, pensions)

- **Visual Projections**
  - Interactive bar chart showing income vs expenses over time
  - Line chart displaying net worth growth towards FIRE target
  - Key metrics including years to FIRE and portfolio value

- **Monte Carlo Simulations**
  - Run thousands of simulations with randomized market returns
  - Account for volatility and "Black Swan" events
  - Calculate probability of successfully reaching FIRE
  - View success/failure rates and median years to FIRE

### 📊 Asset Allocation Manager
- Portfolio allocation tracking and visualization
- Rebalancing recommendations
- DCA (Dollar Cost Averaging) helper
- Import/Export functionality for portfolio data

## Getting Started

### Prerequisites

- Node.js (version 18 or higher recommended)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/mbianchidev/fire-calculator.git
cd fire-calculator
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to the URL shown in the terminal (typically http://localhost:5173)

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### Deployment

The project is automatically deployed to GitHub Pages on every push to the `main` branch using GitHub Actions.

**Automatic Deployment:**
- Pushes to the `main` branch trigger the deployment workflow
- The workflow builds the project and deploys to GitHub Pages
- The live site is available at: https://mbianchidev.github.io/fire-calculator/

**Workflow Details:**
- Build job: Installs dependencies, runs build, and uploads artifacts
- Deploy job: Deploys the built files to GitHub Pages
- The workflow configuration is in `.github/workflows/deploy.yml`

**Manual Deployment:**
If you need to deploy manually or to a different environment, build the project and serve the `dist` directory.

## Usage

1. **Homepage**: Visit the root page to see an overview of all available tools
   - Navigate to FIRE Calculator or Asset Allocation Manager
   - Read about the features and capabilities

2. **FIRE Calculator** (at `/fire-calculator`): Configure Your Inputs
   - Use the left sidebar to enter your financial information
   - Start with initial savings and asset allocation
   - Enter your income, expenses, and savings rate
   - Set your FIRE target withdrawal rate
   - Configure expected market returns

3. **View Projections**: The main area displays:
   - Years to FIRE and key metrics
   - Net worth growth chart
   - Income vs expenses breakdown

4. **Run Monte Carlo Simulations**: 
   - Scroll to the Monte Carlo section
   - Adjust simulation parameters (volatility, Black Swan probability)
   - Click "Run Simulations" to see probability of success

5. **Asset Allocation Manager** (at `/asset-allocation`):
   - Track your portfolio allocation across different asset classes
   - Get rebalancing recommendations
   - Use the DCA helper for investment planning

## Technology Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **React Router** - Client-side routing
- **Vite** - Build tool
- **Recharts** - Data visualization
- **CSS3** - Styling

## Disclaimer

These tools are for educational and planning purposes only. They make assumptions about future market returns and do not account for all real-world factors. Always consult with a qualified financial advisor before making investment decisions.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

ISC License - see LICENSE file for details

