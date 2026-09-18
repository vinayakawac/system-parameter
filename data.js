// Illustrative records and acceptance rules, not production configuration.
const records = [
  ['Session timeout', '30', '5–120 minutes', 'Automatically sign out inactive users.', 5, 120],
  ['Maximum login attempts', '5', '3–10 attempts', 'Lock an account after consecutive unsuccessful attempts.', 3, 10],
  ['Password expiry period', '90', '30–365 days', 'Number of days before a password must be changed.', 30, 365],
  ['Minimum password length', '12', '8–64 characters', 'Minimum characters required for a user password.', 8, 64],
  ['Password history count', '5', '0–24 passwords', 'Prevent reuse of recently used passwords.', 0, 24],
  ['Account lockout duration', '30', '5–120 minutes', 'Time before a locked account can attempt to sign in.', 5, 120],
  ['Enable audit trail', 'Y', 'Y / N', 'Record changes made to enterprise transactions.'],
  ['Allow concurrent sessions', 'N', 'Y / N', 'Allow a user to sign in on multiple devices.'],
  ['Default date format', 'DD/MM/YYYY', 'DD/MM/YYYY · MM/DD/YYYY · YYYY-MM-DD', 'Display format for dates across the application.'],
  ['Default time format', '24', '12 / 24', 'Display time using a 12-hour or 24-hour clock.'],
  ['Default language', 'EN', 'EN / FR / DE / ES', 'Language used for new user profiles.'],
  ['Decimal precision', '2', '0–6 decimal places', 'Number of decimal places displayed for numeric values.', 0, 6],
  ['Thousand separator', ',', ', / . / SPACE', 'Character used to group digits in numeric values.'],
  ['Enable email notifications', 'Y', 'Y / N', 'Send email notifications for system events.'],
  ['Notification retry count', '3', '0–10 attempts', 'Retry unsuccessful notification deliveries.', 0, 10],
  ['Maximum attachment size', '25', '1–100 MB', 'Maximum file size allowed for a single attachment.', 1, 100],
  ['Enable automatic numbering', 'Y', 'Y / N', 'Generate document numbers automatically.'],
  ['Default document prefix', 'DOC', '1–12 letters or numbers', 'Prefix applied to automatically numbered documents.'],
  ['Document number length', '8', '4–16 digits', 'Length of the generated document number.', 4, 16],
  ['Enable approval reminders', 'Y', 'Y / N', 'Remind approvers about pending transactions.'],
  ['Approval reminder interval', '24', '1–168 hours', 'Time between reminders for pending approvals.', 1, 168],
  ['Approval escalation period', '72', '1–720 hours', 'Time before a pending approval is escalated.', 1, 720],
  ['Allow backdated transactions', 'N', 'Y / N', 'Permit transactions with a date in a prior period.'],
  ['Backdated transaction window', '7', '0–90 days', 'Maximum lookback when backdated transactions are enabled.', 0, 90],
  ['Allow future-dated transactions', 'N', 'Y / N', 'Permit transactions with a future effective date.'],
  ['Future transaction window', '30', '0–365 days', 'Maximum forward date for future transactions.', 0, 365],
  ['Default financial year start', '4', '1–12 (month)', 'Calendar month in which the financial year begins.', 1, 12],
  ['Enable period close checks', 'Y', 'Y / N', 'Check pending transactions before closing a period.'],
  ['Rounding method', 'HALF_UP', 'HALF_UP / HALF_EVEN / DOWN', 'Method used to round calculated numeric values.'],
  ['Default currency', 'INR', 'INR / USD / EUR / GBP', 'Currency used when a transaction has no explicit currency.'],
  ['Exchange rate precision', '6', '2–8 decimal places', 'Decimal precision used to display exchange rates.', 2, 8],
  ['Enable multi-currency', 'Y', 'Y / N', 'Allow transactions in supported foreign currencies.'],
  ['Enable duplicate checks', 'Y', 'Y / N', 'Check new documents against existing document references.'],
  ['Duplicate check window', '90', '1–365 days', 'Lookback period used for duplicate document checks.', 1, 365],
  ['Enable transaction comments', 'Y', 'Y / N', 'Allow users to add comments to transactions.'],
  ['Maximum comment length', '2000', '100–10000 characters', 'Maximum length of a transaction comment.', 100, 10000],
  ['Enable file attachments', 'Y', 'Y / N', 'Allow documents to be attached to transactions.'],
  ['Maximum attachments per record', '10', '1–50 files', 'Maximum number of files attached to a record.', 1, 50],
  ['Enable scheduled reports', 'Y', 'Y / N', 'Allow users to schedule recurring report generation.'],
  ['Report execution timeout', '300', '30–3600 seconds', 'Time limit for a report generation request.', 30, 3600],
  ['Report retention period', '30', '1–365 days', 'Time to keep generated reports available for download.', 1, 365],
  ['Default export format', 'XLSX', 'XLSX / CSV / PDF', 'Default file format for exported reports.'],
  ['Maximum export rows', '10000', '100–100000 rows', 'Maximum number of records in a single report export.', 100, 100000],
  ['Enable background processing', 'Y', 'Y / N', 'Process supported long-running tasks in the background.'],
  ['Background job retry count', '3', '0–10 attempts', 'Number of retries for a failed background job.', 0, 10],
  ['Background job retry interval', '60', '10–3600 seconds', 'Delay between background job retry attempts.', 10, 3600],
  ['Enable integration logging', 'Y', 'Y / N', 'Log integration request and response metadata.'],
  ['Integration request timeout', '60', '5–300 seconds', 'Time to wait for an external service response.', 5, 300],
  ['Integration retry count', '3', '0–10 attempts', 'Retry failed requests to external services.', 0, 10],
  ['Integration retry delay', '30', '1–300 seconds', 'Delay between external service retry attempts.', 1, 300],
  ['Enable system event logging', 'Y', 'Y / N', 'Record application events for operational review.'],
  ['Event log retention period', '90', '7–730 days', 'Time to retain system event log records.', 7, 730],
  ['Audit log retention period', '365', '30–2555 days', 'Time to retain changes recorded in the audit trail.', 30, 2555],
  ['Enable maintenance notice', 'Y', 'Y / N', 'Show notices ahead of planned system maintenance.'],
  ['Maintenance notice lead time', '24', '1–168 hours', 'Time before maintenance when a notice becomes visible.', 1, 168],
  ['Enable in-app notifications', 'Y', 'Y / N', 'Show system notifications inside the application.'],
  ['Notification retention period', '30', '1–365 days', 'Time to retain notifications in the user inbox.', 1, 365],
  ['Enable daily digest', 'N', 'Y / N', 'Combine eligible notifications into a daily summary.'],
  ['Daily digest hour', '9', '0–23 (hour)', 'Hour of the day when the daily summary is generated.', 0, 23],
  ['Enable data archiving', 'Y', 'Y / N', 'Allow eligible historical records to be archived.'],
  ['Archive eligibility period', '365', '90–3650 days', 'Minimum record age before it is eligible for archiving.', 90, 3650],
  ['Enable user preferences', 'Y', 'Y / N', 'Allow users to personalize supported display settings.'],
  ['Default list page size', '48', '16 / 24 / 48 / 96', 'Default number of records returned for list views.'],
  ['Enable contextual help', 'Y', 'Y / N', 'Display contextual help within supported screens.'],
];
function choicesOf(accepted) {
  return accepted.includes(' · ') ? accepted.split(' · ') : accepted.split(' / ');
}
// Editor kind drives which Nebula input renders the value:
// number -> NbNumeric (spinner), boolean -> NbSwitch, choice -> NbDropdown, text -> NbTextbox.
function kindOf(name, accepted, min) {
  if (min !== undefined) return 'number';
  if (accepted === 'Y / N') return 'boolean';
  if (name === 'Default document prefix') return 'text';
  return 'choice';
}
export const parameters = records.map(([name, value, accepted, remarks, min, max], index) => {
  const kind = kindOf(name, accepted, min);
  return { id: `p${index + 1}`, name, value, accepted, remarks, min, max, kind, options: kind === 'choice' ? choicesOf(accepted) : undefined };
});
export function validate(parameter, value) {
  if (!value.trim()) return 'Enter a value.';
  if (parameter.min !== undefined) return /^\d+$/.test(value) && Number(value) >= parameter.min && Number(value) <= parameter.max ? '' : `Enter a whole number from ${parameter.min} to ${parameter.max}.`;
  if (parameter.name === 'Default document prefix') return /^[a-zA-Z0-9]{1,12}$/.test(value) ? '' : 'Use 1–12 letters or numbers.';
  const choices = choicesOf(parameter.accepted);
  return choices.includes(value) ? '' : `Use ${choices.join(' or ')}.`;
}
