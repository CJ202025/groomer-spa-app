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

async function checkData() {
  const citaId = '3144c07d-af10-436c-b0ac-c96e9875090b';
  console.log(`Checking appointment: ${citaId}`);
  
  const { data: cita } = await supabase.from('appointments').select('*').eq('id', citaId).single();
  console.log('Appointment data:', cita);
  
  if (cita && cita.usuario_id) {
    console.log(`Checking user: ${cita.usuario_id}`);
    const { data: user } = await supabase.from('users').select('*').eq('id', cita.usuario_id).single();
    console.log('User data in public.users:', user ? 'EXISTS' : 'DOES NOT EXIST!');
  }
}

checkData();
