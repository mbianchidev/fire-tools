-- 0001_initial.down.sql
-- Reverts 0001_initial.up.sql.
-- Drop indexes first, then tables in reverse dependency order so foreign
-- keys never block a DROP. schema_migrations itself is managed by the
-- runner and is NOT dropped here.

DROP INDEX IF EXISTS idx_banks_country;
DROP INDEX IF EXISTS idx_pdf_imports_user_status;
DROP INDEX IF EXISTS idx_questionnaire_user_time;
DROP INDEX IF EXISTS idx_financial_ops_user_date;
DROP INDEX IF EXISTS idx_financial_ops_month_date;
DROP INDEX IF EXISTS idx_tax_entries_month;
DROP INDEX IF EXISTS idx_debt_entries_month;
DROP INDEX IF EXISTS idx_pension_entries_month;
DROP INDEX IF EXISTS idx_cash_entries_month;
DROP INDEX IF EXISTS idx_asset_holdings_month;
DROP INDEX IF EXISTS idx_income_entries_month;
DROP INDEX IF EXISTS idx_expense_entries_category;
DROP INDEX IF EXISTS idx_expense_entries_month;
DROP INDEX IF EXISTS idx_assets_user_class;
DROP INDEX IF EXISTS idx_monte_carlo_runs_user_time;
DROP INDEX IF EXISTS idx_notifications_user_unread;

DROP TABLE IF EXISTS banks;
DROP TABLE IF EXISTS portfolio_metadata_cache;
DROP TABLE IF EXISTS pdf_imports;
DROP TABLE IF EXISTS questionnaire_results;
DROP TABLE IF EXISTS financial_operations;
DROP TABLE IF EXISTS tax_entries;
DROP TABLE IF EXISTS debt_entries;
DROP TABLE IF EXISTS pension_entries;
DROP TABLE IF EXISTS cash_entries;
DROP TABLE IF EXISTS asset_holdings;
DROP TABLE IF EXISTS net_worth_months;
DROP TABLE IF EXISTS net_worth_years;
DROP TABLE IF EXISTS net_worth_config;
DROP TABLE IF EXISTS category_overrides;
DROP TABLE IF EXISTS custom_categories;
DROP TABLE IF EXISTS category_budgets;
DROP TABLE IF EXISTS income_entries;
DROP TABLE IF EXISTS expense_entries;
DROP TABLE IF EXISTS expense_months;
DROP TABLE IF EXISTS expense_years;
DROP TABLE IF EXISTS expense_tracker_config;
DROP TABLE IF EXISTS assets;
DROP TABLE IF EXISTS asset_allocation_config;
DROP TABLE IF EXISTS monte_carlo_runs;
DROP TABLE IF EXISTS calculator_inputs;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS notification_preferences;
DROP TABLE IF EXISTS user_settings;
DROP TABLE IF EXISTS users;
