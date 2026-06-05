import { writable } from 'svelte/store';

const monthList = [];

// first month is November 2020
// JavaScript UTC months are zero-based
const firstMonth = new Date(Date.UTC(2020, 10, 1));
const now = new Date();
const latestMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
const formatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

for (
  let monthDate = new Date(latestMonth);
  monthDate >= firstMonth;
  monthDate = new Date(Date.UTC(monthDate.getUTCFullYear(), monthDate.getUTCMonth() - 1, 1))
) {
  monthList.push(formatter.format(monthDate));
}

export const months = writable(monthList);
