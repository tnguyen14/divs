/**
 * @typedef {Record<string, unknown>} SchwabRecord
 *
 * A rule matches a record. It can be:
 * - the name of a transaction type below (e.g. 'dividend')
 * - a raw Schwab "Action" value (e.g. 'Reinvest Shares')
 * - a predicate function (record) => boolean
 * @typedef {string | ((record: SchwabRecord) => boolean)} Rule
 *
 * @typedef {Object} ColumnDefinition
 * @property {string} name
 * @property {Rule[]} include - record matches if ANY of these match
 * @property {Rule[]} [exclude] - ...and NONE of these match
 * @property {(record: SchwabRecord) => boolean} [where] - ...and this holds
 */

/**
 * Transaction types: named groups of Schwab "Action" values.
 * Mirrors the "Schwab Actions" table on the Metadata tab of the Personal sheet.
 * @type {Record<string, string[]>}
 */
export const transactionTypes = {
  deposit: ['Funds Received', 'MoneyLink Transfer', 'Bank Interest', 'Journal'],
  dividend: [
    'Cash Dividend',
    'Qualified Dividend',
    'Non-Qualified Div',
    'Pr Yr Cash Div',
    'Special Dividend',
    'Pr Yr Qualified Div',
    'Pr Yr Non-Qual Div',
  ],
  tax: ['Foreign Tax Paid'],
  buy: ['Buy'],
  sell: ['Sell'],
};

/** @param {SchwabRecord} record */
export const isPositive = (record) => parseAmount(record.Amount) > 0;
/** @param {SchwabRecord} record */
export const isNegative = (record) => parseAmount(record.Amount) < 0;

/**
 * Monthly table columns, each summing the Amount of matching records.
 * @type {ColumnDefinition[]}
 */
export const columns = [
  { name: 'Savings', include: [] },
  { name: 'Deposits', include: [] },
  { name: 'Dividends', include: ['dividend'] },
  { name: 'Sell', include: ['sell'] },
  { name: 'Other Deposits', include: [] },
  { name: 'Buy', include: ['buy'] },
  { name: 'Tax Withdrawal', include: [] },
  { name: 'Income Withdrawal', include: [] },
  { name: 'Other Withdrawals', include: [] },
];

/**
 * Parse a formatted Sheets amount like "-$1,234.56" into a number.
 * @param {unknown} value
 * @returns {number}
 */
export function parseAmount(value) {
  if (typeof value === 'number') return value;
  const number = Number(String(value ?? '').replace(/[$,\s]/g, ''));
  return Number.isFinite(number) ? number : 0;
}

/**
 * @param {Rule} rule
 * @param {SchwabRecord} record
 * @returns {boolean}
 */
function matchesRule(rule, record) {
  if (typeof rule === 'function') return rule(record);
  const actions = transactionTypes[rule] ?? [rule];
  return actions.includes(/** @type {string} */ (record.Action));
}

/**
 * @param {ColumnDefinition} column
 * @param {SchwabRecord} record
 * @returns {boolean}
 */
export function matchesColumn(column, record) {
  return (
    column.include.some((rule) => matchesRule(rule, record)) &&
    !(column.exclude ?? []).some((rule) => matchesRule(rule, record)) &&
    (column.where ? column.where(record) : true)
  );
}

/**
 * Sum the Amount of records matching a column.
 * @param {ColumnDefinition} column
 * @param {SchwabRecord[]} records
 * @returns {number}
 */
export function sumColumn(column, records) {
  return records
    .filter((record) => matchesColumn(column, record))
    .reduce((total, record) => total + parseAmount(record.Amount), 0);
}
