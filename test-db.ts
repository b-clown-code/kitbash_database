/**
 * Test script to verify Supabase connection and insert test data
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testDatabase() {
  console.log('Testing Supabase connection...\n')

  // Test 1: Check lines table
  console.log('1. Checking lines table...')
  const { data: lines, error: linesError } = await supabase.from('lines').select('*')
  if (linesError) {
    console.error('Error fetching lines:', linesError)
  } else {
    console.log(`   Found ${lines?.length || 0} lines`)
    if (lines && lines.length > 0) {
      console.log(`   Sample: ${JSON.stringify(lines[0], null, 2)}`)
    }
  }

  // Test 2: Check figures table
  console.log('\n2. Checking figures table...')
  const { data: figures, error: figuresError } = await supabase.from('figures').select('*')
  if (figuresError) {
    console.error('Error fetching figures:', figuresError)
  } else {
    console.log(`   Found ${figures?.length || 0} figures`)
    if (figures && figures.length > 0) {
      console.log(`   Sample: ${JSON.stringify(figures[0], null, 2)}`)
    }
  }

  // Test 3: Check mold_families table
  console.log('\n3. Checking mold_families table...')
  const { data: moldFamilies, error: moldError } = await supabase.from('mold_families').select('*')
  if (moldError) {
    console.error('Error fetching mold_families:', moldError)
  } else {
    console.log(`   Found ${moldFamilies?.length || 0} mold families`)
    if (moldFamilies && moldFamilies.length > 0) {
      console.log(`   Sample: ${JSON.stringify(moldFamilies[0], null, 2)}`)
    }
  }

  // Test 4: Check part_definitions table
  console.log('\n4. Checking part_definitions table...')
  const { data: partDefs, error: partError } = await supabase.from('part_definitions').select('*')
  if (partError) {
    console.error('Error fetching part_definitions:', partError)
  } else {
    console.log(`   Found ${partDefs?.length || 0} part definitions`)
    if (partDefs && partDefs.length > 0) {
      console.log(`   Sample: ${JSON.stringify(partDefs[0], null, 2)}`)
    }
  }

  // Test 5: Check with joins
  console.log('\n5. Checking figures with joins...')
  const { data: figuresWithJoins, error: joinError } = await supabase
    .from('figures')
    .select('*, lines(name)')
  if (joinError) {
    console.error('Error fetching figures with joins:', joinError)
  } else {
    console.log(`   Found ${figuresWithJoins?.length || 0} figures with joins`)
    if (figuresWithJoins && figuresWithJoins.length > 0) {
      console.log(`   Sample: ${JSON.stringify(figuresWithJoins[0], null, 2)}`)
    }
  }

  console.log('\nTest complete.')
}

testDatabase().catch(console.error)
