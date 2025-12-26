# 🔥 FIRE Calculator

A comprehensive FIRE (Financial Independence Retire Early) calculator application with Monte Carlo simulations.

## Features

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

## Usage

1. **Configure Your Inputs**: Use the left sidebar to enter your financial information
   - Start with initial savings and asset allocation
   - Enter your income, expenses, and savings rate
   - Set your FIRE target withdrawal rate
   - Configure expected market returns

2. **View Projections**: The main area displays:
   - Years to FIRE and key metrics
   - Net worth growth chart
   - Income vs expenses breakdown

3. **Run Monte Carlo Simulations**: 
   - Scroll to the Monte Carlo section
   - Adjust simulation parameters (volatility, Black Swan probability)
   - Click "Run Simulations" to see probability of success

## Technology Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Recharts** - Data visualization
- **CSS3** - Styling

## Disclaimer

This calculator is for educational and planning purposes only. It makes assumptions about future market returns and does not account for all real-world factors. Always consult with a qualified financial advisor before making investment decisions.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

ISC License - see LICENSE file for details

