import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ftnnnibsmpcyqpbqlgyj.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0bm5uaWJzbXBjeXFwYnFsZ3lqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0OTMwMTIsImV4cCI6MjA5NDA2OTAxMn0.3D81S_OoG-BK1Pcz7egJYRiBzlyzVbfEjV1qwoG8TDY'

export const supabase = createClient(supabaseUrl, supabaseKey)
