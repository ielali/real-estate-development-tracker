-- Delete old cost categories
DELETE FROM categories WHERE type = 'cost';

-- Insert comprehensive Australian real estate development cost categories
-- First insert parent groups
INSERT INTO categories (id, type, display_name, parent_id) VALUES
('cost_hard_costs', 'cost', 'Hard Costs', NULL),
('cost_pre_development', 'cost', 'Pre-Development', NULL),
('cost_professional_fees', 'cost', 'Professional Fees', NULL),
('cost_govt_charges', 'cost', 'Government Charges & Taxes', NULL),
('cost_finance_costs', 'cost', 'Finance Costs', NULL),
('cost_insurance', 'cost', 'Insurance', NULL),
('cost_marketing_sales', 'cost', 'Marketing & Sales', NULL),
('cost_other_soft', 'cost', 'Other Soft Costs', NULL);

-- Insert Hard Costs
INSERT INTO categories (id, type, display_name, parent_id) VALUES
('cost_site_prep', 'cost', 'Site Preparation', 'cost_hard_costs'),
('cost_demolition', 'cost', 'Demolition', 'cost_hard_costs'),
('cost_foundation', 'cost', 'Foundation & Structural', 'cost_hard_costs'),
('cost_materials', 'cost', 'Construction Materials', 'cost_hard_costs'),
('cost_labor', 'cost', 'Labor & Trades', 'cost_hard_costs'),
('cost_electrical', 'cost', 'Electrical', 'cost_hard_costs'),
('cost_plumbing', 'cost', 'Plumbing', 'cost_hard_costs'),
('cost_hvac', 'cost', 'HVAC', 'cost_hard_costs'),
('cost_carpentry', 'cost', 'Carpentry', 'cost_hard_costs'),
('cost_painting', 'cost', 'Painting', 'cost_hard_costs'),
('cost_roofing', 'cost', 'Roofing', 'cost_hard_costs'),
('cost_flooring', 'cost', 'Flooring', 'cost_hard_costs'),
('cost_landscaping', 'cost', 'Landscaping & External Works', 'cost_hard_costs'),
('cost_site_improvements', 'cost', 'Site Improvements', 'cost_hard_costs'),
('cost_specialty', 'cost', 'Specialty Work', 'cost_hard_costs'),
('cost_hard_contingency', 'cost', 'Hard Cost Contingency', 'cost_hard_costs');

-- Insert Pre-Development Costs
INSERT INTO categories (id, type, display_name, parent_id) VALUES
('cost_land_acquisition', 'cost', 'Land Acquisition', 'cost_pre_development'),
('cost_feasibility', 'cost', 'Feasibility Studies', 'cost_pre_development'),
('cost_market_research', 'cost', 'Market Research', 'cost_pre_development'),
('cost_due_diligence', 'cost', 'Due Diligence', 'cost_pre_development'),
('cost_environmental', 'cost', 'Environmental Assessments', 'cost_pre_development'),
('cost_geotechnical', 'cost', 'Geotechnical Investigations', 'cost_pre_development');

-- Insert Professional Fees
INSERT INTO categories (id, type, display_name, parent_id) VALUES
('cost_design', 'cost', 'Architectural Design', 'cost_professional_fees'),
('cost_engineering', 'cost', 'Engineering Fees', 'cost_professional_fees'),
('cost_town_planning', 'cost', 'Town Planning', 'cost_professional_fees'),
('cost_quantity_surveyor', 'cost', 'Quantity Surveyor', 'cost_professional_fees'),
('cost_project_management', 'cost', 'Project Management', 'cost_professional_fees'),
('cost_legal', 'cost', 'Legal Fees', 'cost_professional_fees'),
('cost_accounting', 'cost', 'Accounting Fees', 'cost_professional_fees');

-- Insert Government Charges & Taxes
INSERT INTO categories (id, type, display_name, parent_id) VALUES
('cost_stamp_duty', 'cost', 'Stamp Duty', 'cost_govt_charges'),
('cost_gst', 'cost', 'GST', 'cost_govt_charges'),
('cost_infrastructure_charges', 'cost', 'Infrastructure Charges', 'cost_govt_charges'),
('cost_developer_contributions', 'cost', 'Developer Contributions', 'cost_govt_charges'),
('cost_council_rates', 'cost', 'Council Rates & Land Tax', 'cost_govt_charges'),
('cost_permits_fees', 'cost', 'Permits & Application Fees', 'cost_govt_charges');

-- Insert Finance Costs
INSERT INTO categories (id, type, display_name, parent_id) VALUES
('cost_loan_fees', 'cost', 'Loan Establishment Fees', 'cost_finance_costs'),
('cost_interest', 'cost', 'Interest Payments', 'cost_finance_costs'),
('cost_bank_guarantee', 'cost', 'Bank Guarantee Fees', 'cost_finance_costs'),
('cost_valuation', 'cost', 'Valuation Fees', 'cost_finance_costs');

-- Insert Insurance
INSERT INTO categories (id, type, display_name, parent_id) VALUES
('cost_builders_risk', 'cost', 'Builders Risk Insurance', 'cost_insurance'),
('cost_public_liability', 'cost', 'Public Liability Insurance', 'cost_insurance'),
('cost_professional_indemnity', 'cost', 'Professional Indemnity', 'cost_insurance'),
('cost_contract_works', 'cost', 'Contract Works Insurance', 'cost_insurance');

-- Insert Marketing & Sales
INSERT INTO categories (id, type, display_name, parent_id) VALUES
('cost_marketing', 'cost', 'Marketing & Advertising', 'cost_marketing_sales'),
('cost_sales_commission', 'cost', 'Sales Agent Commission', 'cost_marketing_sales'),
('cost_display_suite', 'cost', 'Display Suite/Home', 'cost_marketing_sales'),
('cost_signage', 'cost', 'Signage & Branding', 'cost_marketing_sales');

-- Insert Other Soft Costs
INSERT INTO categories (id, type, display_name, parent_id) VALUES
('cost_equipment', 'cost', 'Equipment Rental', 'cost_other_soft'),
('cost_utilities', 'cost', 'Utilities & Services', 'cost_other_soft'),
('cost_temporary_services', 'cost', 'Temporary Services', 'cost_other_soft'),
('cost_security', 'cost', 'Security', 'cost_other_soft'),
('cost_soft_contingency', 'cost', 'Soft Cost Contingency', 'cost_other_soft'),
('cost_developer_fees', 'cost', 'Developer Fees & Overhead', 'cost_other_soft');
