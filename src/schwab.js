import { derived, get, writable } from 'svelte/store';
import { monthFormatter, months } from './months';

/**
 * @typedef {Record<string, unknown> & {Amount: number}} SchwabRecord
 */

/**
 * Parse an "M/D/YYYY" date as local midnight, to match how months.js creates
 * and formats months. Parsing the parts directly avoids `new Date(string)`,
 * whose handling of non-ISO strings varies by browser.
 * @param {unknown} value
 * @returns {Date | null}
 */
function parseDate(value) {
	const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(String(value ?? '').trim());
	if (!match) {
		return null;
	}
	const [, month, day, year] = match.map(Number);
	return new Date(year, month - 1, day);
}

/**
 * @param {unknown} payload
 * @returns {Record<string, SchwabRecord[]>}
 */
export function groupSchwabByMonth(payload) {
	const monthLabels = get(months);
	const grouped = Object.fromEntries(monthLabels.map((month) => [month, []]));
	const records = Array.isArray(payload) ? payload : [];

	for (const record of records) {
		const date = parseDate(record['Date - Clean']);
		if (!date) {
			console.error('Invalid Schwab record Date - Clean value:', record['Date - Clean'], record);
			continue;
		}

		const monthLabel = monthFormatter.format(date);
		if (grouped[monthLabel]) {
			grouped[monthLabel].push(record);
		}
	}

	return grouped;
}

/** @type {import('svelte/store').Writable<unknown>} */
export const schwab = writable(null);

/** @type {import('svelte/store').Readable<Record<string, SchwabRecord[]>>} */
export const schwabByMonth = derived([schwab, months], ([$schwab]) => groupSchwabByMonth($schwab));

/**
 * Named groups of Schwab "Action" values.
 * Mirrors the "Schwab Actions" table on the Metadata tab of the Personal sheet.
 * @type {Record<string, string[]>}
 */
export const actions = {
	deposit: ['Funds Received', 'MoneyLink Transfer', 'Bank Interest', 'Journal'],
	dividend: [
		'Cash Dividend',
		'Qualified Dividend',
		'Non-Qualified Div',
		'Pr Yr Cash Div',
		'Special Dividend',
		'Pr Yr Qualified Div',
		'Pr Yr Non-Qual Div'
	],
	tax: ['Foreign Tax Paid'],
	buy: ['Buy'],
	sell: ['Sell']
};

/**
 * @param {SchwabRecord} record
 * @param {string} group - key of `actions`
 */
export const isAction = (record, group) => actions[group].includes(/** @type {string} */ (record.Action));

/**
 * Sum the Amount of records matching a predicate.
 * @param {SchwabRecord[]} records
 * @param {(record: SchwabRecord) => boolean} predicate
 * @returns {number}
 */
export function sumAmount(records, predicate) {
	return records.filter(predicate).reduce((total, record) => total + record.Amount, 0);
}
