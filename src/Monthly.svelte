<script>
  const columns = [
    'Month',
    'Savings',
    'Deposits',
    'Dividends',
    'Sell',
    'Other Deposits',
    'Buy',
    'Tax Withdrawal',
    'Income Withdrawal',
    'Other Withdrawals',
    'Value',
    'Annualized Dividend %',
  ];
</script>

<section class="monthly">
  <h2>Monthly</h2>
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          {#each columns as column}
            <th scope="col">{column}</th>
          {/each}
        </tr>
      </thead>
      <tbody>
        <tr>
          <td colspan={columns.length}>No monthly data yet.</td>
        </tr>
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