import { derived, get, writable } from 'svelte/store';
import { monthFormatter, months } from './months';

/**
 * @typedef {Record<string, unknown> & {Amount: number}} SchwabRecord
 */

/**
 * @param {unknown} payload
 * @returns {Record<string, SchwabRecord[]>}
 */
export function groupSchwabByMonth(payload) {
	const monthLabels = get(months);
	const grouped = Object.fromEntries(monthLabels.map((month) => [month, []]));
	const records = Array.isArray(payload) ? payload : [];

	for (const record of records) {
		let monthLabel;
		try {
			monthLabel = monthFormatter.format(
				new Date(/** @type {string | number | Date} */ (record['Date - Clean']))
			);
		} catch (error) {
			console.error('Invalid Schwab record Date - Clean value:', record['Date - Clean'], record, error);
			continue;
		}

		if (monthLabel && grouped[monthLabel]) {
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
