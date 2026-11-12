import { writable } from 'svelte/store';

const monthList = [];

// Months are created and formatted in the local time zone.
// first month is November 2020 (JavaScript months are zero-based)
const firstMonth = new Date(2020, 10, 1);
const now = new Date();
const latestMonth = new Date(now.getFullYear(), now.getMonth(), 1);
export const monthFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  year: 'numeric',
});

for (
  let monthDate = latestMonth;
  monthDate >= firstMonth;
  monthDate = new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1)
) {
  monthList.push(monthFormatter.format(monthDate));
}

export const months = writable(monthList);
