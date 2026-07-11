const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'ecosmart_admin',
  password: 'ecosmart_secure_pass',
  database: 'ecosmart_core',
});

async function runQuery() {
  try {
    await client.connect();
    console.log('✅ Connected to database');

    const query = `
      SELECT 
        table_name,
        json_agg(
          json_build_object(
            'column_name', column_name,
            'data_type', data_type,
            'is_nullable', is_nullable,
            'column_default', column_default
          ) ORDER BY ordinal_position
        ) as columns
      FROM information_schema.columns
      WHERE table_schema = 'public'
      GROUP BY table_name
      ORDER BY table_name;
    `;

    const result = await client.query(query);
    
    console.log(JSON.stringify(result.rows, null, 2));

    await client.end();
    console.log('✅ Done! Copy the JSON output above to ChartDB');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

runQuery();