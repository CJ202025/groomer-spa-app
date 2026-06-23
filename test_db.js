const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const envVars = envFile.split('\n').reduce((acc, line) => {
  const match = line.replace('\r', '').match(/^([^=]+)=(.*)$/);
  if (match) acc[match[1]] = match[2].trim();
  return acc;
}, {});

const supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = envVars['SUPABASE_SERVICE_ROLE_KEY'];

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('--- TEST 8: GESTION CITAS QUERY ---');
  const { data: citas, error: errorCitas } = await supabase
    .from("appointments")
    .select(`
      id,
      estado,
      cliente:usuario_id ( nombre_completo, email, es_miembro_elite ),
      barbero:barbero_id ( id, nombre_completo, email )
    `)
    .limit(3);
  
  if (errorCitas) {
      console.log('Error with implicit FK:', errorCitas);
  } else {
      console.log('Implicit FK Result:', JSON.stringify(citas, null, 2));
  }

  console.log('\n--- TEST 6: SERVICES QUERY ---');
  const { data: servicios, error: errorServicios } = await supabase
    .from("services")
    .select("id, precio_base")
    .limit(3);
  
  console.log('Services:', servicios);
  console.log('Error:', errorServicios);
}

run();
