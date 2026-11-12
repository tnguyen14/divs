<script>
  import { months } from './months';
  import { schwabByMonth } from './schwab';
  import { columns, sumColumn } from './transactionTypes';

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
          <tr>
            <td>{month}</td>
            {#each columns as column}
              <td>{formatAmount(sumColumn(column, $schwabByMonth[month] || []))}</td>
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
