import { derived, get, writable } from 'svelte/store';
import { monthFormatter, months } from './months';

/**
 * @typedef {Record<string, unknown>} SchwabRecord
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
