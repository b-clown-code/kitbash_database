/**
 * Test if tables exist and check schema
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTables() {
  console.log('Checking what tables exist...\n')

  // Try a raw query on a simple table
  console.log('Trying to query lines table...')
  const { data: lines, error: linesError } = await supabase
    .from('lines')
    .select('*')
    .limit(1)
  
  if (linesError) {
    console.error('Error querying lines:', linesError.message)
    console.error('Code:', linesError.code)
  } else {
    console.log('✓ Lines table accessible')
    console.log('  Count of rows:', lines?.length || 0)
  }

  // Try figures
  console.log('\nTrying to query figures table...')
  const { data: figures, error: figuresError } = await supabase
    .from('figures')
    .select('*')
    .limit(1)
  
  if (figuresError) {
    console.error('Error querying figures:', figuresError.message)
  } else {
    console.log('✓ Figures table accessible')
    console.log('  Count of rows:', figures?.length || 0)
  }
}

checkTables().catch(console.error)
