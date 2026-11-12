<script>
  import { months } from './months';
  import { schwabByMonth, isAction, parseAmount, sumAmount } from './schwab';

  /**
   * Each column computes a month's value from that month's Schwab records.
   * `row` holds the values of the columns before it.
   * @type {{name: string, value: (records: import('./schwab').SchwabRecord[], row: Record<string, number>) => number}[]}
   */
  const columns = [
    { name: 'Savings', value: (records) => sumAmount(records, (r) => r.Type === 'Savings') },
    {
      name: 'Deposits',
      value: (records) => sumAmount(records, (r) => parseAmount(r.Amount) > 0 && isAction(r, 'deposit') && r.Type !== 'Savings'),
    },
    { name: 'Dividends', value: (records) => sumAmount(records, (r) => isAction(r, 'dividend')) },
    { name: 'Sell', value: (records) => sumAmount(records, (r) => isAction(r, 'sell')) },
    {
      name: 'Other Deposits',
      value: (records, row) =>
        sumAmount(records, (r) => parseAmount(r.Amount) > 0) -
        (row['Savings'] + row['Deposits'] + row['Dividends'] + row['Sell']),
    },
    { name: 'Buy', value: (records) => sumAmount(records, (r) => isAction(r, 'buy')) },
    { name: 'Tax Withdrawal', value: (records) => sumAmount(records, (r) => isAction(r, 'tax')) },
    { name: 'Income Withdrawal', value: (records) => sumAmount(records, (r) => r.Type === 'Income') },
    {
      name: 'Other Withdrawals',
      value: (records, row) =>
        sumAmount(records, (r) => parseAmount(r.Amount) < 0) -
        (row['Buy'] + row['Tax Withdrawal'] + row['Income Withdrawal']),
    },
  ];

  /**
   * @param {import('./schwab').SchwabRecord[]} records
   * @returns {Record<string, number>}
   */
  function computeRow(records) {
    /** @type {Record<string, number>} */
    const row = {};
    for (const column of columns) {
      row[column.name] = column.value(records, row);
    }
    return row;
  }

  const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

  /** @param {number} amount */
  const formatAmount = (amount) => (amount ? currency.format(amount) : '');
</script>

<section class="monthly">
  <h2>Monthly</h2>
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th scope="col">Month</th>
          {#each columns as column}
            <th scope="col">{column.name}</th>
          {/each}
          <th scope="col">Value</th>
          <th scope="col">Annualized Dividend %</th>
        </tr>
      </thead>
      <tbody>
        {#each $months as month}
          {@const row = computeRow($schwabByMonth[month] || [])}
          <tr>
            <td>{month}</td>
            {#each columns as column}
              <td>{formatAmount(row[column.name])}</td>
            {/each}
            <td></td>
            <td></td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</section>

<style>
  .monthly {
    margin-top: 1.5rem;
    text-align: left;
  }

  .monthly h2 {
    margin: 0 0 0.75rem;
    font-size: 1.1rem;
  }

  .table-wrap {
    overflow-x: auto;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    background: #fff;
  }

  table {
    width: 100%;
    min-width: 70rem;
    border-collapse: collapse;
  }

  th,
  td {
    padding: 0.75rem;
    border-bottom: 1px solid #e2e8f0;
    white-space: nowrap;
    text-align: left;
  }

  thead {
    background: #f8fafc;
  }

  tbody td {
    color: #475569;
  }

  tbody tr:last-child td {
    border-bottom: none;
  }
</style>
