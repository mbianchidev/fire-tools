# GitHub Pages Deployment Setup

This document provides instructions for enabling GitHub Pages deployment for the FIRE Calculator project.

## Overview

This repository now includes a GitHub Actions workflow that automatically deploys the project to GitHub Pages whenever changes are pushed to the `main` branch.

## Enabling GitHub Pages (One-Time Setup)

After this PR is merged, the repository owner needs to enable GitHub Pages with the following steps:

### Step 1: Navigate to Repository Settings
1. Go to the repository: https://github.com/mbianchidev/fire-calculator
2. Click on **Settings** tab
3. In the left sidebar, click on **Pages**

### Step 2: Configure GitHub Pages Source
1. Under **Source**, select **GitHub Actions** from the dropdown menu
2. That's it! No other configuration is needed.

### Step 3: Verify Deployment
1. After the next push to the `main` branch, the workflow will automatically run
2. You can monitor the workflow progress in the **Actions** tab
3. Once complete, the site will be available at: **https://mbianchidev.github.io/fire-calculator/**

## How It Works

### Automatic Deployment Workflow

The deployment is handled by `.github/workflows/deploy.yml` which:

1. **Triggers** on every push to the `main` branch
2. **Build Job**:
   - Checks out the code
   - Sets up Node.js (version 20)
   - Installs dependencies with `npm ci`
   - Builds the project with `npm run build`
   - Uploads the `dist` directory as an artifact

3. **Deploy Job**:
   - Takes the build artifact
   - Deploys it to GitHub Pages
   - Provides the deployment URL

### Configuration Details

- **Base Path**: The Vite configuration includes `base: '/fire-calculator/'` to ensure all assets load correctly on GitHub Pages
- **Permissions**: The workflow has appropriate permissions to write to GitHub Pages
- **Concurrency**: Only one deployment runs at a time to prevent conflicts

## Monitoring Deployments

You can monitor deployments in several ways:

1. **Actions Tab**: Shows all workflow runs and their status
2. **Deployments Section**: Visible in the right sidebar of the repository homepage
3. **Commit Status**: Each commit to `main` will show a deployment status

## Troubleshooting

If the deployment doesn't work:

1. **Check GitHub Pages Settings**: Ensure the source is set to "GitHub Actions"
2. **Check Workflow Permissions**: Go to Settings → Actions → General → Workflow permissions and ensure "Read and write permissions" is enabled
3. **Review Workflow Logs**: Check the Actions tab for any error messages
4. **Verify Build Locally**: Run `npm run build` locally to ensure the build succeeds

## Manual Deployment (Alternative)

If you prefer to deploy manually:

```bash
# Build the project
npm run build

# Deploy the dist directory to your hosting service
# The dist directory contains all necessary files
```

## Additional Resources

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [GitHub Actions for Pages](https://github.com/actions/deploy-pages)
- [Vite Static Deploy Guide](https://vitejs.dev/guide/static-deploy.html)
